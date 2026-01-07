import 'reflect-metadata'
import { Middleware, MiddlewareOptions, type H3 } from 'h3'
import { Application } from '@h3ravel/core'
import { Request, Response, JsonResponse } from '@h3ravel/http'
import { Arr, Collection, isClass, MacroableClass, Str, Stringable, tap } from '@h3ravel/support'
import { IDispatcher } from '@h3ravel/contracts'
import { Magic, mix } from '@h3ravel/shared'
import { IMiddleware, IRequest, IResponse, IRouter, RouteActions, ActionInput, MiddlewareList, ResponsableType } from '@h3ravel/contracts'
import type { EventHandler, IController, GenericObject, ResourceOptions, ResourceMethod, CallableConstructor, MiddlewareIdentifier } from '@h3ravel/contracts'
import { RouteMethod, IResponsable } from '@h3ravel/contracts'
import { internal } from '@h3ravel/shared'
import { Route } from './Route'
import { Routing } from './Events/Routing'
import { RouteMatched } from './Events/RouteMatched'
import { RouteCollection } from './RouteCollection'
import { RouteGroup } from './RouteGroup'
import { MiddlewareResolver } from './MiddlewareResolver'
import { PreparingResponse } from './Events/PreparingResponse'
import { ResponsePrepared } from './Events/ResponsePrepared'
import { Pipeline } from './Pipeline'
import { PendingSingletonResourceRegistration } from './PendingSingletonResourceRegistration'
import { ResourceRegistrar } from './ResourceRegistrar'
import { PendingResourceRegistration } from './PendingResourceRegistration'
import { RouteRegistrar } from './RouteRegisterer'
import { createRequire } from 'module'
import { existsSync } from 'node:fs'
import { ImplicitRouteBinding } from './ImplicitRouteBinding'

export class Router extends mix(IRouter, MacroableClass, Magic) {
    private DIST_DIR: string
    private routes: RouteCollection
    private routeNames: string[] = []
    private current?: Route
    private currentRequest!: IRequest

    private middlewareMap: IMiddleware[] = []
    private groupMiddleware: EventHandler[] = []

    /**
     * The registered route value binders.
     */
    protected binders: Record<string, any> = {}

    /**
     * All of the short-hand keys for middlewares.
     */
    private middlewares: GenericObject<IMiddleware> = {}

    /**
     * All of the middleware groups.
     */
    protected middlewareGroups: GenericObject<MiddlewareList> = {}

    /**
     * The route group attribute stack.
     */
    protected groupStack: GenericObject<any>[] = []

    /**
     * The event dispatcher instance.
     */
    protected events?: IDispatcher

    /**
     * The priority-sorted list of middleware.
     *
     * Forces the listed middleware to always be in the given order.
     */
    public middlewarePriority: MiddlewareList = []

    /**
     * The registered custom implicit binding callback.
     */
    protected implicitBindingCallback?: (container: Application, route: Route, defaultFn: CallableConstructor) => any

    /**
     * All of the verbs supported by the router.
     */
    static verbs: RouteMethod[] = ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']

    constructor(protected h3App: H3, private app: Application) {
        super()
        this.events = app.has('app.events') ? app.make('app.events') : undefined
        this.routes = new RouteCollection()
        // return makeMagic(this)
        this.DIST_DIR = env('DIST_DIR', '/.h3ravel/serve/')
    }

    /**
     * Add a route to the underlying route collection.
     * 
     * @param method
     * @param uri
     * @param action
     */
    addRoute (
        methods: RouteMethod | RouteMethod[],
        uri: string,
        action: ActionInput
    ): Route {
        const route = this.routes.add(this.createRoute(methods, uri, action))
        return route
    }

    /**
     * Get the currently dispatched route instance.
     */
    getCurrentRoute (): Route | undefined {
        return this.current
    }

    /**
     * Check if a route with the given name exists.
     *
     * @param name
     */
    has (...name: string[]): boolean {
        for (const value of name) {
            if (!this.routes.hasNamedRoute(value)) {
                return false
            }
        }

        return true
    }

    /**
     * Get the current route name.
     */
    currentRouteName (): string | undefined {
        return this.current?.getName()
    }

    /**
     * Alias for the "currentRouteNamed" method.
     *
     * @param  patterns
     */
    is (...patterns: string[]): boolean {
        return this.currentRouteNamed(...patterns)
    }

    /**
     * Determine if the current route matches a pattern.
     *
     * @param patterns
     */
    currentRouteNamed (...patterns: string[]): boolean {
        return !!this.current?.named(...patterns)
    }

    /**
     * Get the underlying route collection.
     */
    getRoutes (): RouteCollection {
        return this.routes
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
    newRoute (methods: RouteMethod | RouteMethod[], uri: string, action: ActionInput) {
        return new Route(methods, uri, action)
            .setRouter(this)
            .setContainer(this.app)
            .setUri(uri)
        // .sync(this.h3App)
    }

    /**
     * Dispatch the request to the application.
     *
     * @param request
     */
    async dispatch (request: Request) {
        this.currentRequest = request
        return await this.dispatchToRoute(request)
    }

    /**
     * Dispatch the request to a route and return the response.
     *
     * @param request
     */
    async dispatchToRoute (request: Request) {
        return await this.runRoute(request, this.findRoute(request))
    }

    /**
     * Find the route matching a given request.
     *
     * @param request
     */
    protected findRoute (request: Request) {
        this.events?.dispatch(new Routing(request))

        const route = this.routes.match(request)

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

        this.events?.dispatch(new RouteMatched(route, request))
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
     */
    getMiddleware (): GenericObject {
        return this.middlewares
    }

    /**
     * Register a short-hand name for a middleware.
     *
     * @param  name
     * @param  class
     */
    aliasMiddleware (name: string, cls: IMiddleware): this {
        this.middlewares[name] = cls

        return this
    }

    /**
     * Gather the middleware for the given route with resolved class names.
     *
     * @param  route
     */
    gatherRouteMiddleware (route: Route): MiddlewareList {
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
     */
    resolveMiddleware (middleware: MiddlewareList, excluded: MiddlewareList = []): any {
        excluded = excluded.length === 0
            ? excluded
            : (new Collection(excluded))
                .map((name) => MiddlewareResolver.setApp(this.app).resolve(name, this.middlewares, this.middlewareGroups))
                .flatten()
                .values()
                .all() as never

        const middlewares = (new Collection(middleware))
            .map((name) => MiddlewareResolver.setApp(this.app).resolve(name, this.middlewares, this.middlewareGroups))
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
     * @param  middlewares
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
    async prepareResponse (request: IRequest, response: ResponsableType): Promise<IResponse> {
        this.events?.dispatch(new PreparingResponse(request, response))

        return tap(Router.toResponse(request, response), (response) => {
            this.events?.dispatch(new ResponsePrepared(request, response))
        })
    }

    /**
     * Static version of prepareResponse.
     *
     * @param  request
     * @param  response
     */
    static toResponse (request: IRequest, response: ResponsableType<Response>): IResponse {
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
     * Substitute the route bindings onto the route.
     *
     * @param  route
     *
     * @throws {ModelNotFoundException<IModel>}
     */
    async substituteBindings (route: Route): Promise<Route> {
        for (const [key, value] of Object.entries(route.parameters ?? {})) {
            if (typeof this.binders[key] !== 'undefined') {
                route.setParameter(key, await this.performBinding(key, value, route))
            }
        }

        return route
    }

    /**
     * Substitute the implicit route bindings for the given route.
     *
     * @param  route
     *
     * @throws {ModelNotFoundException<IModel>}
     */
    async substituteImplicitBindings (route: Route): Promise<any | undefined> {
        const defaultFn = () => ImplicitRouteBinding.resolveForRoute(this.app, route)

        return await Reflect.apply(
            this.implicitBindingCallback ?? defaultFn,
            undefined,
            [this.app, route, defaultFn]
        )
    }

    /**
     * Register a callback to run after implicit bindings are substituted.
     *
     * @param  callback
     */
    substituteImplicitBindingsUsing (callback: CallableConstructor): this {
        this.implicitBindingCallback = callback

        return this
    }

    /**
     * Call the binding callback for the given key.
     *
     * @param  key
     * @param  value
     * @param  route
     *
     * @throws {ModelNotFoundException<IModel>}
     */
    protected performBinding (key: string, value: string, route: Route): Promise<any> {
        return Reflect.apply(
            this.binders[key],
            undefined,
            [value, route]
        )
    }

    /**
     * Remove any duplicate middleware from the given array.
     *
     * @param  middleware
     */
    static uniqueMiddleware (middleware: MiddlewareList): MiddlewareIdentifier[] {
        return Array.from(new Set(middleware))
    }

    /**
     * Registers a route that responds to HTTP GET requests.
     * 
     * @param uri - The route uri.
     * @param action - The handler function or [controller class, method] array.
     * @returns 
     */
    get<C extends typeof IController> (uri: string, action: ActionInput<C>): Route {
        return this.addRoute(['GET'], uri, action)
    }

    /**
     * Registers a route that responds to HTTP HEAD requests.
     * 
     * @param uri - The route uri.
     * @param action - The handler function or [controller class, method] array.
     * @returns 
     */
    head<C extends typeof IController> (uri: string, action: ActionInput<C>): Route {
        return this.addRoute(['HEAD'], uri, action)
    }

    /**
     * Registers a route that responds to HTTP POST requests.
     * 
     * @param uri - The route uri.
     * @param action - The handler function or [controller class, method] array.
     * @returns 
     */
    post<C extends typeof IController> (uri: string, action: ActionInput<C>): Route {
        return this.addRoute(['POST'], uri, action)
    }

    /**
     * Registers a route that responds to HTTP PUT requests.
     * 
     * @param uri - The route uri.
     * @param action - The handler function or [controller class, method] array.
     * @returns 
     */
    put<C extends typeof IController> (uri: string, action: ActionInput<C>): Route {
        return this.addRoute(['PUT'], uri, action)
    }

    /**
     * Registers a route that responds to HTTP PATCH requests.
     * 
     * @param uri - The route uri.
     * @param action - The handler function or [controller class, method] array.
     * @returns 
     */
    patch<C extends typeof IController> (uri: string, action: ActionInput<C>): Route {
        return this.addRoute(['PATCH'], uri, action)
    }

    /**
     * Registers a route that responds to HTTP OPTIONS requests.
     * 
     * @param uri - The route uri.
     * @param action - The handler function or [controller class, method] array.
     * @returns 
     */
    options<C extends typeof IController> (uri: string, action: ActionInput<C>): Route {
        return this.addRoute(['OPTIONS'], uri, action)
    }

    /**
     * Registers a route that responds to HTTP DELETE requests.
     * 
     * @param uri - The route uri.
     * @param action - The handler function or [controller class, method] array.
     * @returns 
     */
    delete<C extends typeof IController> (uri: string, action: ActionInput<C>): Route {
        return this.addRoute(['DELETE'], uri, action)
    }

    /**
     * Registers a route the matches the provided methods.
     * 
     * @param methods - The route methods to match.
     * @param uri - The route uri.
     * @param action - The handler function or [controller class, method] array.
     */
    match<C extends typeof IController> (methods: RouteMethod | RouteMethod[], uri: string, action: ActionInput<C>): Route {
        return this.addRoute(Arr.wrap(methods), uri, action)
    }

    /**
     * Route a resource to a controller.
     *
     * @param  name
     * @param  controller
     * @param  options
     */
    resource<C extends typeof IController> (name: string, controller: C, options: ResourceOptions = {}): PendingResourceRegistration {
        let registrar: ResourceRegistrar
        if (this.app && this.app.bound(ResourceRegistrar)) {
            registrar = this.app.make(ResourceRegistrar)
        } else {
            registrar = new ResourceRegistrar(this)
        }

        return new PendingResourceRegistration(
            registrar,
            name,
            controller,
            options
        ).$finalize()
    }

    /**
     * Register an array of API resource controllers.
     *
     * @param  resources
     * @param  options
     */
    apiResources (resources: GenericObject<typeof IController>, options: ResourceOptions = {}): void {
        for (const [name, controller] of Object.entries(resources)) {
            this.apiResource(name, controller, options)
        }
    }

    /**
     * Route an API resource to a controller.
     *
     * @param  name
     * @param  controller
     * @param  options
     */
    apiResource<C extends typeof IController> (name: string, controller: C, options: ResourceOptions = {}): PendingResourceRegistration {
        let only: ResourceMethod[] = ['index', 'show', 'store', 'update', 'destroy']

        if (typeof options.except !== 'undefined') {
            only = only.filter(value => !options.except?.includes(value))
        }

        return this.resource(name, controller, Object.assign({}, { only }, options))
    }

    /**
     * Register an array of singleton resource controllers.
     *
     * @param  singletons
     * @param  options
     */
    singletons (singletons: GenericObject<typeof IController>, options: ResourceOptions = {}): void {
        for (const [name, controller] of Object.entries(singletons)) {
            this.singleton(name, controller, options)
        }
    }

    /**
     * Route a singleton resource to a controller.
     *
     * @param  name
     * @param  controller
     * @param  options
     */
    singleton<C extends typeof IController> (name: string, controller: C, options: ResourceOptions = {}): PendingSingletonResourceRegistration {
        let registrar: ResourceRegistrar

        if (this.app && this.app.bound(ResourceRegistrar)) {
            registrar = this.app.make(ResourceRegistrar)
        } else {
            registrar = new ResourceRegistrar(this)
        }

        return new PendingSingletonResourceRegistration(
            registrar,
            name,
            controller,
            options
        ).$finalize()
    }

    /**
     * Register an array of API singleton resource controllers.
     *
     * @param  singletons
     * @param  options
     */
    apiSingletons (singletons: GenericObject<typeof IController>, options: ResourceOptions = {}): void {
        for (const [name, controller] of Object.entries(singletons)) {
            this.apiSingleton(name, controller, options)
        }
    }

    /**
     * Route an API singleton resource to a controller.
     *
     * @param  name
     * @param  controller
     * @param  options
     */
    apiSingleton<C extends typeof IController> (name: string, controller: C, options: ResourceOptions = {}): PendingSingletonResourceRegistration {
        let only: ResourceMethod[] = ['store', 'show', 'update', 'destroy']

        if (typeof options.except !== 'undefined') {
            only = only.filter(v => !options.except?.includes(v))
        }

        return this.singleton(name, controller, Object.assign({ only }, options))
    }

    /**
     * Create a route group with shared attributes.
     *
     * @param  attributes
     * @param  routes
     */
    group<C extends ((_e: this) => void) | string> (attributes: RouteActions, routes: C | C[]) {
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
    mergeWithLastGroup (newItems: RouteActions, prependExistingPrefix = true) {
        return RouteGroup.merge(newItems, Arr.last(this.groupStack, true)[0], prependExistingPrefix)
    }

    /**
     * Load the provided routes.
     *
     * @param  routes
     */
    protected async loadRoutes (routes: string | ((_e: this) => void)) {
        const require = createRequire(import.meta.url)
        if (typeof routes === 'function') {
            routes(this)
        } else if (existsSync(this.app.paths.distPath(routes))) {
            require(this.app.paths.distPath(routes))
        }
    }

    /**
     * Get the prefix from the last group on the stack.
     */
    getLastGroupPrefix () {
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
    hasGroupStack () {
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
    @internal
    protected prefix (uri: string) {
        return Str.trim(Str.trim(this.getLastGroupPrefix(), '/') + '/' + Str.trim(uri, '/'), '/') || '/'
    }

    /**
     * Registers H3 middleware for a specific path.
     * 
     * @param path - The middleware or path to apply the middleware.
     * @param handler - The middleware handler.
     * @param opts - Optional middleware options.
     */
    h3middleware (
        path: string | IMiddleware[] | Middleware,
        handler?: Middleware | MiddlewareOptions,
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

    /**
     * Dynamically handle calls into the router instance.
     *
     * @param  method
     * @param  parameters
     */
    protected __call (method: string, parameters: any[]) {
        // console.log(method, this.constructor.name, 'this.constructor.name')
        if (Router.hasMacro(method)) {
            return this.macroCall(method, parameters)
        }

        if (method === 'middleware') {
            return new RouteRegistrar(this).attribute(method, Array.isArray(parameters[0]) ? parameters[0] : parameters)
        }

        if (method === 'can') {
            return new RouteRegistrar(this).attribute(method, [parameters])
        }

        if (method !== 'where' && Str.startsWith(method, 'where')) {
            const registerer = new RouteRegistrar(this)
            return Reflect.apply(registerer[method], registerer, parameters)
        }

        return new RouteRegistrar(this).attribute(method, parameters?.[0] ?? true)
    }
}
