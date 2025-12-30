import 'reflect-metadata'
import { H3Event, Middleware, MiddlewareOptions, type H3 } from 'h3'
import { Application, Container, Kernel } from '@h3ravel/core'
import { Request, Response, HttpContext, JsonResponse } from '@h3ravel/http'
import { Arr, Collection, isClass, Str, Stringable, tap } from '@h3ravel/support'
import { Dispatcher } from '@h3ravel/events'
import { FileSystem } from '@h3ravel/shared'
import { IMiddleware, IRequest, IResponse, IRouter, RouteActions, RouterEnd, ActionInput, MiddlewareList, MiddlewareIdentifier, ResponsableType } from '@h3ravel/contracts'
import type { EventHandler, ClassicRouteDefinition, ExtractClassMethods, IController } from '@h3ravel/contracts'
import { Helpers } from './Helpers'
import { RouteMethod, RouteEventHandler, IResponsable } from '@h3ravel/contracts'
import { ExceptionHandler } from '@h3ravel/foundation'
import { Route } from './Route'
import { Routing } from './Events/Routing'
import { RouteMatched } from './Events/RouteMatched'
import { RouteCollection } from './RouteCollection'
import { RouteGroup } from './RouteGroup'
import { MiddlewareResolver } from './MiddlewareResolver'
import { PreparingResponse } from './Events/PreparingResponse'
import { ResponsePrepared } from './Events/ResponsePrepared'
import { Pipeline } from './Pipeline'

export class Router implements IRouter {
    private routes: ClassicRouteDefinition[] = []
    private routeNames: string[] = []
    private routePrefixes: string[] = []
    private groupPrefix = ''
    private current?: Route
    private collection: RouteCollection
    private currentRequest!: IRequest

    /**
     * All of the short-hand keys for middlewares.
     */
    #middleware: Record<string, IMiddleware> = {}

    private middlewareMap: IMiddleware[] = []
    private groupMiddleware: EventHandler[] = []

    /**
     * All of the middleware groups.
     */
    protected middlewareGroups: Record<string, MiddlewareIdentifier[]> = {}

    /**
     * The route group attribute stack.
     */
    protected groupStack: Record<string, any>[] = []

    /**
     * The event dispatcher instance.
     */
    protected events: Dispatcher

    /**
     * All of the verbs supported by the router.
     */
    public static verbs: RouteMethod[] = ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']

    constructor(protected h3App: H3, private app: Application) {
        this.events = app.has('app.events') ? app.make('app.events') : undefined
        this.collection = new RouteCollection()
    }

    /**
     * Route Resolver
     * 
     * @param handler 
     * @param middleware 
     * @returns 
     */
    private resolveHandler (handler: EventHandler, middleware: IMiddleware[] = []) {
        return async (event: H3Event) => {
            this.app.context ??= async (event) => {
                // Reuse the already attached context for this event if any
                if ((event as any)._h3ravelContext)
                    return (event as any)._h3ravelContext

                Request.enableHttpMethodParameterOverride()
                const ctx = HttpContext.init({
                    app: this.app,
                    request: await Request.create(event, this.app),
                    response: new Response(this.app, event),
                }, event);

                (event as any)._h3ravelContext = ctx
                return ctx
            }

            const globalMiddleware = this.app.has('app.globalMiddleware')
                ? this.app.make('app.globalMiddleware') || []
                : []

            const middlewareStack: IMiddleware[] = [
                ...globalMiddleware,
                ...middleware,
            ]

            // Initialize the Application Kernel
            const kernel = new Kernel(this.app, middlewareStack)

            return await kernel.resolve(event, middleware, handler)
        }
    }

    /**
     * Add a route to the stack
     * 
     * @param method
     * @param path
     * @param handler
     * @param name
     * @param middleware
     */
    #addRoute (
        methods: RouteMethod | RouteMethod[],
        uri: string,
        action: ActionInput
    ): Route {
        const route = this.collection.add(this.createRoute(methods, uri, action))
        return route
    }

    /**
     * Add a route to the stack
     * 
     * @param method
     * @param path
     * @param handler
     * @param name
     * @param middleware
     */
    private addRoute (
        method: Lowercase<RouteMethod>,
        path: string,
        handler: EventHandler,
        name?: string,
        middleware: IMiddleware[] = [],
        signature: ClassicRouteDefinition['signature'] = ['', '']
    ) {
        /**
         * Join all defined route names to make a single route name
         */
        if (this.routeNames.length > 0) {
            name = this.routeNames.join('.')
        }

        /**
         * Join all defined middlewares
         */
        if (this.middlewareMap.length > 0) {
            middleware = this.middlewareMap
        }

        /**
         * Join all defined prefixes
         */
        const prefix = this.routePrefixes.join('')

        const fullPath = `${this.groupPrefix}${prefix}${path}`.replace(/\/+/g, '/')
        this.routes.push({ method, path: fullPath, name, handler, signature })

        /**
         * Register Route as a H3 route
         */
        this.h3App[method](fullPath, this.resolveHandler(handler, middleware))
        this.app.singleton('app.routes', () => this.routes)
    }

    /**
     * Get the currently dispatched route instance.
     */
    public getCurrentRoute (): Route | undefined {
        return this.current
    }

    /**
     * Check if a route with the given name exists.
     *
     * @param name
     */
    public has (...name: string[]): boolean {
        for (const value of name) {
            if (!this.collection.hasNamedRoute(value)) {
                return false
            }
        }

        return true
    }

    /**
     * Get the current route name.
     */
    public currentRouteName (): string | undefined {
        return this.current?.getName()
    }

    /**
     * Alias for the "currentRouteNamed" method.
     *
     * @param  patterns
     */
    public is (...patterns: string[]): boolean {
        return this.currentRouteNamed(...patterns)
    }

    /**
     * Determine if the current route matches a pattern.
     *
     * @param patterns
     */
    public currentRouteNamed (...patterns: string[]): boolean {
        return !!this.current?.named(...patterns)
    }

    /**
     * Get the underlying route collection.
     */
    public getRoutes (): RouteCollection {
        return this.collection
    }

    /**
     * Determine if the action is routing to a controller.
     *
     * @param action
     */
    protected actionReferencesController (action: ActionInput) {
        if (typeof action !== 'function') {
            return typeof action === 'string' ||
                (action && !Array.isArray(action) && (action as RouteActions).uses && typeof action === (action as RouteActions).uses)
        }

        return false
    }

    /**
     * Create a new route instance.
     *
     * @param  methods
     * @param  uri
     * @param  action
     */
    protected createRoute (methods: RouteMethod | RouteMethod[], uri: string, action: ActionInput) {
        // If the route is routing to a controller we will parse the route action into
        // an acceptable array format before registering it and creating this route
        // instance itself. We need to build the Closure that will call this out.
        // if (this.actionReferencesController(action)) {
        //     action = this.convertToControllerAction(action)
        // }

        const route = this.newRoute(
            methods, this.prefix(uri), action
        )

        // If we have groups that need to be merged, we will merge them now after this
        // route has already been created and is ready to go. After we're done with
        // the merge we will be ready to return the route back out to the caller.
        if (this.hasGroupStack()) {
            this.mergeGroupAttributesIntoRoute(route)
        }

        return route
    }

    /**
     * Create a new Route object.
     *
     * @param  methods
     * @param  uri
     * @param  action
     */
    public newRoute (methods: RouteMethod | RouteMethod[], uri: string, action: ActionInput) {
        return new Route(methods, uri, action)
            .setRouter(this)
            .setContainer(this.app)
            .setUri(uri)
        // .sync(this.h3App)
    }

    /**
     * Resolves a route handler definition into an executable EventHandler.
     *
     * A handler can be:
     *   - A function matching the EventHandler signature
     *   - A controller class (optionally decorated for IoC resolution)
     *
     * If it’s a controller class, this method will:
     *   - Instantiate it (via IoC or manually)
     *   - Call the specified method (defaults to `index`)
     *
     * @param handler     Event handler function OR controller class
     * @param methodName  Method to invoke on the controller (defaults to 'index')
     */
    private resolveControllerOrHandler<C extends new (...args: any[]) => any> (
        handler: EventHandler | C,
        methodName?: string,
        path?: string,
    ): EventHandler {
        /**
         * Checks if the handler is a function (either a plain function or a class constructor)
         */
        if (typeof handler === 'function' && typeof (handler as any).prototype !== 'undefined') {
            return async (ctx) => {
                const { Model } = await import('@h3ravel/database')
                let controller: IController
                if (Container.hasAnyDecorator(handler as any)) {
                    /**
                     * If the controller is decorated use the IoC container
                     */
                    controller = this.app.make(handler as C)
                } else {
                    /**
                     * Otherwise instantiate manually so that we can at least
                     * pass the app instance
                     */
                    controller = new (handler as C)(this.app)
                }

                /**
                 * The method to execute (defaults to 'index')
                 */
                const action = (methodName || 'index') as keyof IController

                /**
                 * Ensure the method exists on the controller
                 */
                if (typeof controller[action] !== 'function') {
                    throw new Error(`Method "${String(action)}" not found on controller ${handler.name}`)
                }

                // const method = this.app.invoke(controller, action, [ctx], async (inst) => {
                //     if (inst instanceof Model) {
                //         // Route model binding returns a Promise
                //         return await Helpers.resolveRouteModelBinding(path ?? '', ctx, inst)
                //     }
                //     return inst
                // })

                /**
                 * Get param types for the controller method
                 */
                const paramTypes: any[] = Reflect.getMetadata('design:paramtypes', controller, action) || []

                /**
                 * Resolve the bound dependencies
                 */
                let args = await Promise.all(
                    paramTypes.map(async (paramType: any) => {
                        switch (paramType?.name) {
                            case 'Application':
                                return this.app
                            case 'Request':
                                return ctx.request
                            case 'Response':
                                return ctx.response
                            case 'HttpContext':
                                return ctx
                            default: {
                                const inst = this.app.make(paramType)
                                if (inst instanceof Model) {
                                    // Route model binding returns a Promise
                                    return await Helpers.resolveRouteModelBinding(path ?? '', ctx, inst)
                                }
                                return inst
                            }
                        }
                    })
                )

                /**
                 * Ensure that the HttpContext is always available
                 */
                if (args.length < 1) {
                    args = [ctx]
                }

                /**
                 * Call the controller method, passing all resolved dependencies
                 */
                return await this.handleResponse(async () => await (controller[action] as any)?.(...args), ctx)
            }
        }

        /**
         * Call the route callback handler
         */
        return async (ctx) => {
            return await this.handleResponse(handler as EventHandler, ctx)
        }
    }

    /**
     * Gracefully handle the outgoing response and pass all caught errors
     * to the exception handler.
     * 
     * @param handler 
     * @param ctx 
     * @returns 
     */
    private async handleResponse (handler: (ctx: HttpContext) => Promise<IResponse>, ctx: HttpContext): Promise<IResponse> {
        const exceptionHandler = this.app.make(ExceptionHandler)
        if (!exceptionHandler) {
            return await handler(ctx)
        }

        try {
            return await handler(ctx)
        } catch (error) {
            /**
             * Handle the exception here.
             */
            if (typeof exceptionHandler.handle !== 'undefined') {
                return await exceptionHandler.handle(error as Error, ctx) as IResponse
            }

            /**
             * If no exception handler has been defined, throw the original exception.
             */
            throw error
        }
    }

    /**
     * Dispatch the request to the application.
     *
     * @param request
     */
    public async dispatch (request: Request) {
        this.currentRequest = request
        return await this.dispatchToRoute(request)
    }

    /**
     * Dispatch the request to a route and return the response.
     *
     * @param request
     */
    public async dispatchToRoute (request: Request) {
        return await this.runRoute(request, this.findRoute(request))
    }

    /**
     * Find the route matching a given request.
     *
     * @param request
     */
    protected findRoute (request: Request) {
        this.events.dispatch(new Routing(request))

        const route = this.collection.match(request)

        this.current = route

        route.setContainer(this.app)

        this.app.instance(Route, route)

        return route
    }

    /**
     * Return the response for the given route.
     *
     * @param  request
     * @param  route
     */
    protected async runRoute (request: Request, route: Route) {
        request.setRouteResolver(() => route)

        this.events.dispatch(new RouteMatched(route, request))
        const response = await this.prepareResponse(request, await this.runRouteWithinStack(route, request))

        return response
    }

    /**
     * Run the given route within a Stack (onion) instance.
     *
     * @param  route
     * @param  request
     */
    protected async runRouteWithinStack (route: Route, request: Request) {
        const shouldSkipMiddleware = this.app.bound('middleware.disable') && this.app.make('middleware.disable') === true
        const middleware = shouldSkipMiddleware ? [] : this.gatherRouteMiddleware(route)

        return await (new Pipeline<Request>(this.app as never))
            .send(request)
            .through(middleware)
            .then(async (request) => {
                return this.prepareResponse(request, await route.run())
            })
    }

    /**
     * Get all of the defined middleware short-hand names.
     *
     * @return array
     */
    getMiddleware () {
        return this.#middleware
    }

    /**
     * Register a short-hand name for a middleware.
     *
     * @param  name
     * @param  class
     */
    aliasMiddleware (name: string, cls: IMiddleware) {
        this.#middleware[name] = cls

        return this
    }

    /**
     * Gather the middleware for the given route with resolved class names.
     *
     * @param  route
     */
    public gatherRouteMiddleware (route: Route) {
        return this.resolveMiddleware(
            route.gatherMiddleware(),
            route.excludedMiddleware()
        )
    }

    /**
     * Resolve a flat array of middleware classes from the provided array.
     *
     * @param middleware
     * @param excluded
     * @return array
     */
    resolveMiddleware (middleware: IMiddleware[], excluded: IMiddleware[] = []) {
        excluded = excluded.length === 0
            ? excluded
            : (new Collection<IMiddleware>(excluded))
                .map((name) => MiddlewareResolver.setApp(this.app).resolve(name, this.#middleware, this.middlewareGroups))
                .flatten()
                .values()
                .all() as never

        const middlewares = (new Collection<IMiddleware>(middleware))
            .map((name) => MiddlewareResolver.setApp(this.app).resolve(name, this.#middleware, this.middlewareGroups))
            .flatten()

        middlewares.when(
            excluded.length > 0,
            (collection) => {
                collection.reject((name: any) => {
                    if (typeof name === 'function') {
                        return false
                    }

                    if (excluded.includes(name)) {
                        return true
                    }

                    if (!isClass(name)) {
                        return false
                    }

                    const instance = this.app.make(name)

                    return (new Collection(excluded)).contains(
                        (exclude: any) => isClass(exclude) && instance instanceof exclude
                    )
                })
                return collection
            },
        ).values()

        return this.sortMiddleware(middlewares)
    }

    /**
     * Sort the given middleware by priority.
     *
     * @param  \Illuminate\Support\Collection  $middlewares
     * @return array
     */
    protected sortMiddleware (middlewares: Collection) {
        return middlewares.all()
        // TODO: Implement middleware sorting logic
        // return (new SortedMiddleware(this.middlewarePriority, middlewares)).all()
    }

    /**
     * Register a group of middleware.
     *
     * @param  name
     * @param  middleware
     */
    middlewareGroup (name: string, middleware: MiddlewareList): this {
        this.middlewareGroups[name] = middleware

        return this
    }

    /**
     * Create a response instance from the given value.
     *
     * @param  request
     * @param  response
     */
    async prepareResponse (request: IRequest, response: ResponsableType) {
        this.events.dispatch(new PreparingResponse(request, response))

        return tap(Router.toResponse(request, response), (response) => {
            this.events.dispatch(new ResponsePrepared(request, response))
        })
    }

    /**
     * Static version of prepareResponse.
     *
     * @param  request
     * @param  response
     */
    static toResponse (request: IRequest, response: ResponsableType<Response>) {
        if (response instanceof IResponsable) {
            response = response.toResponse(request)
        }

        // if (response instanceof Model && response.wasRecentlyCreated) {
        //     response = new JsonResponse(response, 201)
        // }
        if (response instanceof Stringable || typeof response === 'string') {
            response = new Response(request.app, response.toString(), 200, { 'Content-Type': 'text/html' })
        } else if (!(response instanceof IResponse) && !(response instanceof Response)) {
            response = new JsonResponse(request.app, response)
        }

        if (response.getStatusCode() === Response.codes.HTTP_NOT_MODIFIED) {
            response.setNotModified()
        }

        return response.prepare(request)
    }

    /**
     * Remove any duplicate middleware from the given array.
     *
     * @param  middleware
     */
    static uniqueMiddleware (middleware: MiddlewareList) {
        return Array.from(new Set(middleware))
    }

    /**
     * Registers a route that responds to HTTP GET requests.
     *
     * @param path        The URL pattern to match (can include parameters, e.g., '/users/:id').
     * @param definition  Either:
     *                      - An EventHandler function
     *                      - A tuple: [ControllerClass, methodName]
     * @param name        Optional route name (for URL generation or referencing).
     * @param middleware  Optional array of middleware functions to execute before the handler.
     */
    get<C extends new (...args: any) => any> (
        path: string,
        definition: RouteEventHandler | [C, methodName: ExtractClassMethods<InstanceType<C>>],
        name?: string,
        middleware: IMiddleware[] = []
    ): Omit<this, RouterEnd> {

        const handler = Array.isArray(definition) ? definition[0] : definition
        const methodName = Array.isArray(definition) ? <string>definition[1] : undefined

        // Add the route to the route stack
        this.addRoute(
            'get',
            path,
            this.resolveControllerOrHandler(handler, methodName, path),
            name,
            middleware,
            [handler.name, methodName]
        )

        return this
    }

    /**
     * Registers a route that responds to HTTP POST requests.
     *
     * @param path        The URL pattern to match (can include parameters, e.g., '/users').
     * @param definition  Either:
     *                      - An EventHandler function
     *                      - A tuple: [ControllerClass, methodName]
     * @param name        Optional route name (for URL generation or referencing).
     * @param middleware  Optional array of middleware functions to execute before the handler.
     */
    post<C extends new (...args: any) => any> (
        path: string,
        definition: RouteEventHandler | [C, methodName: ExtractClassMethods<InstanceType<C>>],
        name?: string,
        middleware: IMiddleware[] = []
    ): Omit<this, RouterEnd> {

        const handler = Array.isArray(definition) ? definition[0] : definition
        const methodName = Array.isArray(definition) ? <string>definition[1] : undefined

        // Add the route to the route stack
        this.addRoute(
            'post',
            path,
            this.resolveControllerOrHandler(handler, methodName, path),
            name,
            middleware,
            [handler.name, methodName]
        )

        return this
    }

    /**
     * Registers a route that responds to HTTP PUT requests.
     *
     * @param path        The URL pattern to match (can include parameters, e.g., '/users/:id').
     * @param definition  Either:
     *                      - An EventHandler function
     *                      - A tuple: [ControllerClass, methodName]
     * @param name        Optional route name (for URL generation or referencing).
     * @param middleware  Optional array of middleware functions to execute before the handler.
     */
    put<C extends new (...args: any) => any> (
        path: string,
        definition: RouteEventHandler | [C, methodName: ExtractClassMethods<InstanceType<C>>],
        name?: string,
        middleware: IMiddleware[] = []
    ): Omit<this, RouterEnd> {

        const handler = Array.isArray(definition) ? definition[0] : definition
        const methodName = Array.isArray(definition) ? <string>definition[1] : undefined

        // Add the route to the route stack
        this.addRoute(
            'put',
            path,
            this.resolveControllerOrHandler(handler, methodName, path),
            name,
            middleware,
            [handler.name, methodName]
        )
        return this
    }

    /**
     * Registers a route that responds to HTTP PATCH requests.
     *
     * @param path        The URL pattern to match (can include parameters, e.g., '/users/:id').
     * @param definition  Either:
     *                      - An EventHandler function
     *                      - A tuple: [ControllerClass, methodName]
     * @param name        Optional route name (for URL generation or referencing).
     * @param middleware  Optional array of middleware functions to execute before the handler.
     */
    patch<C extends new (...args: any) => any> (
        path: string,
        definition: RouteEventHandler | [C, methodName: ExtractClassMethods<InstanceType<C>>],
        name?: string,
        middleware: IMiddleware[] = []
    ): Omit<this, RouterEnd> {

        const handler = Array.isArray(definition) ? definition[0] : definition
        const methodName = Array.isArray(definition) ? <string>definition[1] : undefined

        // Add the route to the route stack
        this.addRoute(
            'patch',
            path,
            this.resolveControllerOrHandler(handler, methodName, path),
            name,
            middleware,
            [handler.name, methodName]
        )

        return this
    }

    /**
     * Registers a route that responds to HTTP DELETE requests.
     *
     * @param path        The URL pattern to match (can include parameters, e.g., '/users/:id').
     * @param definition  Either:
     *                      - An EventHandler function
     *                      - A tuple: [ControllerClass, methodName]
     * @param name        Optional route name (for URL generation or referencing).
     * @param middleware  Optional array of middleware functions to execute before the handler.
     */
    delete<C extends new (...args: any) => any> (
        path: string,
        definition: RouteEventHandler | [C, methodName: ExtractClassMethods<InstanceType<C>>],
        name?: string,
        middleware: IMiddleware[] = []
    ): Omit<this, RouterEnd> {

        const handler = Array.isArray(definition) ? definition[0] : definition
        const methodName = Array.isArray(definition) ? <string>definition[1] : undefined

        // Add the route to the route stack
        this.addRoute(
            'delete',
            path,
            this.resolveControllerOrHandler(handler, methodName, path),
            name,
            middleware,
            [handler.name, methodName]
        )

        return this
    }

    /**
     * API Resource support  
     * 
     * @param path 
     * @param controller 
     */
    apiResource<C extends new (...args: any) => any> (
        path: string,
        Controller: C,
        middleware: IMiddleware[] = []
    ): Omit<this, RouterEnd | 'name'> {
        path = path.replace(/\//g, '/')

        const basePath = `/${path}`.replace(/\/+$/, '').replace(/(\/)+/g, '$1')
        const name = basePath.substring(basePath.lastIndexOf('/') + 1).replaceAll(/\/|:/g, '') || ''
        const param = Str.singular(name)

        this.get(basePath, [Controller, <never>'index'], `${name}.index`, middleware)
        this.post(basePath, [Controller, <never>'store'], `${name}.store`, middleware)
        this.get(`${basePath}/:${param}`, [Controller, <never>'show'], `${name}.show`, middleware)
        this.put(`${basePath}/:${param}`, [Controller, <never>'update'], `${name}.update`, middleware)
        this.patch(`${basePath}/:${param}`, [Controller, <never>'update'], `${name}.update`, middleware)
        this.delete(`${basePath}/:${param}`, [Controller, <never>'destroy'], `${name}.destroy`, middleware)

        return this
    }

    /**
     * Registers a route the matches the provided methods.
     * @param methods - The route methods to match.
     * @param uri - The route uri.
     * @param action - The handler function or [controller class, method] array.
     */
    match<C extends typeof IController> (methods: Lowercase<RouteMethod>[], uri: string, action: ActionInput<C>): Route {
        return this.#addRoute(Arr.wrap(methods).map(e => e.toUpperCase() as RouteMethod), uri, action)
    }

    /**
     * Named route URL generator
     * 
     * @param name 
     * @param params 
     * @returns 
     */
    route (name: string, params: Record<string, string> = {}): string | undefined {
        const found = this.routes.find(r => r.name === name)
        if (!found) return undefined

        let url = found.path
        for (const [key, value] of Object.entries(params)) {
            url = url.replace(`:${key}`, value)
        }
        return url
    }

    /**
     * Grouping
     * 
     * @param options 
     * @param callback 
     */
    // group (options: { prefix?: string; middleware?: EventHandler[] }, callback: (_e: this) => void) {
    //     const prevPrefix = this.groupPrefix
    //     const prevMiddleware = [...this.groupMiddleware]

    //     this.groupPrefix += options.prefix || ''
    //     this.groupMiddleware.push(...(options.middleware || []))

    //     callback(this)

    //     /**
    //      * Restore state after group
    //      */
    //     this.groupPrefix = prevPrefix
    //     this.groupMiddleware = prevMiddleware
    //     return this
    // }

    /**
     * Create a route group with shared attributes.
     *
     * @param  attributes
     * @param  routes
     * @return $this
     */
    public group<C extends ((_e: this) => void) | string> (attributes: RouteActions, routes: C | C[]) {
        for (const groupRoutes of Arr.wrap(routes)) {
            this.updateGroupStack(attributes)

            // Once we have updated the group stack, we'll load the provided routes and
            // merge in the group's attributes when the routes are created. After we
            // have created the routes, we will pop the attributes off the stack.
            this.loadRoutes(groupRoutes)

            this.groupStack.pop()
        }

        return this
    }

    /**
     * Update the group stack with the given attributes.
     *
     * @param  attributes
     */
    protected updateGroupStack (attributes: RouteActions) {
        if (this.hasGroupStack()) {
            attributes = this.mergeWithLastGroup(attributes)
        }

        this.groupStack.push(attributes)
    }

    /**
     * Merge the given array with the last group stack.
     *
     * @param  newItems
     * @param  prependExistingPrefix
     */
    public mergeWithLastGroup (newItems: RouteActions, prependExistingPrefix = true) {
        return RouteGroup.merge(newItems, Arr.last(this.groupStack, true)[0], prependExistingPrefix)
    }

    /**
     * Load the provided routes.
     *
     * @param  routes
     */
    protected async loadRoutes (routes: string | ((_e: this) => void)) {
        if (typeof routes === 'function') {
            routes(this)
        } else if (await FileSystem.fileExists(routes)) {
            const { default: route } = await import(routes)
            route(this)
        }
    }

    /**
     * Get the prefix from the last group on the stack.
     */
    public getLastGroupPrefix () {
        if (this.hasGroupStack()) {
            const last = Arr.last(this.groupStack, true)[0]

            return last.prefix ?? ''
        }

        return ''
    }

    /**
     * Merge the group stack with the controller action.
     *
     * @param  route
     */
    protected mergeGroupAttributesIntoRoute (route: Route) {
        route.setAction(this.mergeWithLastGroup(
            route.getAction(),
            false
        ))
    }

    /**
     * Determine if the router currently has a group stack.
     */
    public hasGroupStack () {
        return this.groupStack.length > 0
    }

    /**
     * Set the name of the current route
     * 
     * @param name 
     */
    name (name: string) {
        this.routeNames.push(name)
        return this
    }

    /**
     * Prefix the given URI with the last prefix.
     *
     * @param  uri
     */
    protected prefix (uri: string) {
        return Str.trim(Str.trim(this.getLastGroupPrefix(), '/') + '/' + Str.trim(uri, '/'), '/') || '/'
    }

    /**
     * Registers middleware for a specific path.
     * @param path - The path to apply the middleware.
     * @param handler - The middleware handler.
     * @param opts - Optional middleware options.
     */
    middleware (
        path: string | IMiddleware[] | Middleware,
        handler: Middleware | MiddlewareOptions,
        opts?: MiddlewareOptions
    ): this {
        opts = typeof handler === 'object' ? handler : (typeof opts === 'function' ? opts : {})
        handler = typeof path === 'function' ? path : (typeof handler === 'function' ? handler : () => { })

        if (Array.isArray(path)) {
            this.middlewareMap.concat(path)
        } else if (typeof path === 'function') {
            this.h3App.use('/', () => { }).use(path)
        } else {
            this.h3App.use(path, handler, opts)
        }

        return this
    }
}
