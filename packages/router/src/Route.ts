import { ActionInput, CallableConstructor, ControllerMethod, IController, IControllerDispatcher, IRoute, ResponsableType, RouteActions, RouteMethod } from '@h3ravel/contracts'
import { Application, Container } from '@h3ravel/core'
import { Arr, Obj, Str, isClass } from '@h3ravel/support'

import { CallableDispatcher } from './CallableDispatcher'
import { CompiledRoute } from './CompiledRoute'
import { ControllerDispatcher } from './ControllerDispatcher'
import { H3 } from 'h3'
import { LogicException } from '@h3ravel/foundation'
import { Request } from '@h3ravel/http'
import { RouteAction } from './RouteAction'
import { RouteParameterBinder } from './RouteParameterBinder'
import { RouteUri } from './RouteUri'
import { Router } from './Router'

export class Route extends IRoute {
    /**
     * The URI pattern the route responds to.
     */
    #uri: string

    /**
     * The the matched parameters' original values object.
     */
    #originalParameters?: Record<string, any>

    /**
     * The parameter names for the route.
     */
    #parameterNames?: string[]

    /**
     * The default values for the route.
     */
    _defaults: Record<string, any> = {}

    /**
     * The router instance used by the route.
     */
    protected router!: Router

    /**
     * The compiled version of the route.
     */
    compiled?: CompiledRoute = undefined

    /**
     * The matched parameters object.
     */
    parameters?: Record<string, any>

    /**
     * The container instance used by the route.
     */
    protected container!: Application

    /**
     * The fields that implicit binding should use for a given parameter.
     */
    protected bindingFields!: Record<string, string>

    /**
     * The route action array.
     */
    action: RouteActions

    /**
     * The HTTP methods the route responds to.
     */
    methods: RouteMethod[]

    /**
     * The route path that can be handled by H3.
     */
    path: string = ''

    /**
     * The computed gathered middleware.
     */
    computedMiddleware?: any[]

    /**
     * The controller instance.
     */
    controller?: Required<IController>

    /**
     * 
     * @param methods The HTTP methods the route responds to.
     * @param uri The URI pattern the route responds to.
     */
    constructor(
        methods: RouteMethod | RouteMethod[],
        uri: string,
        action: ActionInput
    ) {
        super()
        this.#uri = uri
        this.methods = Arr.wrap(methods)
        this.action = Arr.except(this.parseAction(action), ['prefix'])

        if (this.methods.includes('GET') && !this.methods.includes('HEAD')) {
            this.methods.push('HEAD')
        }

        this.prefix(Obj.isPlainObject(action) ? Obj.get(action as any, 'prefix') : '')
    }

    /**
     * Set the router instance on the route.
     *
     * @param router
     */
    setRouter (router: Router): this {
        this.router = router

        return this
    }

    /**
     * Set the container instance on the route.
     *
     * @param container
     */
    setContainer (container: Application) {
        this.container = container

        return this
    }

    /**
     * Set the URI that the route responds to.
     *
     * @param uri
     */
    setUri (uri: string) {
        this.#uri = this.parseUri(uri)
        this.path = this.#uri
            .replace(/\{([^}]+)\}/g, ':$1')
            .replace(/:([^/]+)\?\s*$/, '*')
            .replace(/:([^/]+)\?(?=\/|$)/g, ':$1')
        return this
    }

    /**
     * Parse the route URI and normalize / store any implicit binding fields.
     *
     * @param uri
     */
    protected parseUri (uri: string): string {
        this.bindingFields = {}

        const parsed = RouteUri.parse(uri)

        this.bindingFields = parsed.bindingFields

        return parsed.uri
    }

    /**
     * Get the URI associated with the route.
     */
    uri () {
        return this.#uri
    }

    /**
     * Add a prefix to the route URI.
     *
     * @param prefix
     */
    prefix (prefix: string) {
        prefix ??= ''

        this.updatePrefixOnAction(prefix)

        const uri = Str.rtrim(prefix, '/') + '/' + Str.ltrim(this.#uri, '/')

        return this.setUri(uri !== '/' ? Str.trim(uri, '/') : uri)
    }

    /**
     * Update the "prefix" attribute on the action array.
     *
     * @param prefix
     */
    protected updatePrefixOnAction (prefix: string) {
        const newPrefix = Str.trim(Str.rtrim(prefix, '/') + '/' + Str.ltrim(this.action.prefix ?? '', '/'), '/')

        if (newPrefix) {
            this.action.prefix = newPrefix
        }
    }

    /**
     * Get the name of the route instance.
     */
    getName () {
        return this.action.as ?? undefined
    }

    /**
     * Add or change the route name.
     *
     * @param  name
     *
     * @throws {InvalidArgumentException}
     */
    name (name: string): this {
        this.action.as = this.action.as ? this.action.as + name : name
        return this
    }

    /**
     * Determine whether the route's name matches the given patterns.
     *
     * @param patterns
     */
    named (...patterns: string[]) {
        const routeName = this.getName()

        if (!routeName) return false

        for (const pattern of patterns)
            if (Str.is(pattern, routeName)) return true

        return false
    }

    /**
     * Get the action name for the route.
     */
    getActionName () {
        return this.action.handler ?? 'Closure'
    }

    /**
     * Get the method name of the route action.
     *
     * @return string
     */
    getActionMethod () {
        const name = this.getActionName()
        return typeof name === 'string' ? Arr.last(name.split('@')) : name.name
    }

    /**
     * Get the action array or one of its properties for the route.
     * @param key
     */
    getAction (key?: string) {
        if (!key) return this.action

        return Obj.get(this.action, key)
    }

    /**
     * Determine if the route only responds to HTTP requests.
     */
    httpOnly () {
        return Obj.has(this.action, 'http')
    }

    /**
     * Get or set the middlewares attached to the route.
     *
     * @param  middleware
     */
    middleware<X extends any | undefined = undefined> (middleware?: X | X[]): X extends undefined ? any : this {
        if (!middleware)
            return Arr.wrap(this.action.middleware ?? []) as never

        if (!Array.isArray(middleware))
            middleware = Arr.wrap(middleware)

        for (let index = 0; index < middleware.length; index++) {
            const value = middleware[index]
            middleware[index] = value
        }

        this.action.middleware = [...Arr.wrap(this.action.middleware ?? []), ...middleware] as never

        return this
    }

    /**
     * Specify that the "Authorize" / "can" middleware should be applied to the route with the given options.
     *
     * @param  ability
     * @param  models
     */
    can (ability: string, models: string | string[] = []) {
        return !models
            ? this.middleware(['can:' + ability])
            : this.middleware(['can:' + ability + ',' + Arr.wrap(models).join(',')])
    }

    /**
     * Set the action array for the route.
     *
     * @param action
     */
    setAction (action: RouteActions) {
        this.action = action

        if (this.action.domain) {
            this.domain(this.action.domain)
        }

        if (this.action.can) {
            for (const can of this.action.can) {
                this.can(can[0], can[1] ?? [])
            }
        }

        return this
    }

    /**
     * Determine if the route only responds to HTTPS requests.
     */
    secure () {
        return this.action.https === true
    }

    /**
     * Sync the current route with H3
     * 
     * @param h3App 
     */
    sync (h3App: H3) {
        for (const method of this.methods) {
            h3App[method.toLowerCase() as Lowercase<RouteMethod>](this.getPath(), () => response)
        }
    }

    /**
     * Bind the route to a given request for execution.
     *
     * @param request
     */
    bind (request: Request) {
        this.compileRoute()

        this.parameters = (new RouteParameterBinder(this)).parameters(request)

        this.#originalParameters = this.parameters

        return this
    }

    /**
     * Get or set the domain for the route.
     *
     * @param domain
     *
     * @throws {InvalidArgumentException}
     */
    domain<D extends string | undefined = undefined> (domain?: D): D extends undefined ? string : this {
        if (!domain) return this.getDomain() as never

        const parsed = RouteUri.parse(domain)

        this.action.domain = parsed.uri ?? ''

        this.bindingFields = Object.assign({}, this.bindingFields, parsed.bindingFields)

        return this as never
    }

    /**
     * Parse the route action into a standard array.
     *
     * @param action
     *
     * @throws {UnexpectedValueException}
     */
    protected parseAction (action: ActionInput) {
        return RouteAction.parse(this.#uri, action)
    }

    /**
     * Run the route action and return the response.
     */
    async run (): Promise<ResponsableType> {
        this.container ??= new Container() as never

        try {
            if (this.isControllerAction()) {
                return await this.runController()
            }

            return this.runCallable()
        } catch (e) {
            console.log(e)
            return e.getResponse()
        }
    }

    /**
     * Get the key / value list of parameters without empty values.
     */
    parametersWithoutNulls () {
        return Object.fromEntries(Object.entries(this.getParameters()).filter(e => !!e))
    }

    /**
     * Get the key / value list of original parameters for the route.
     *
     * @throws {LogicException}
     */
    originalParameters () {
        if (this.#originalParameters) {
            return this.#originalParameters
        }

        throw new LogicException('Route is not bound.')
    }

    /**
     * Get the matched parameters object.
     */
    getParameters () {
        return this.parameters ?? {}
    }

    /**
     * Get a given parameter from the route.
     *
     * @param  name
     * @param  defaultParam
     */
    parameter (name: string, defaultParam?: any) {
        return Obj.get(this.getParameters(), name, defaultParam)
    }

    /**
     * Get the domain defined for the route.
     */
    getDomain (): string | undefined {
        if (this.action && this.action.domain) {
            return this.action.domain.replace(/https?:\/\//, '')
        }

        return ''
    }

    /**
     * Get the compiled version of the route.
     */
    getCompiled () {
        return this.compiled
    }

    /**
     * Set a default value for the route.
     *
     * @param  key
     * @param  value
     */
    defaults (key: string, value: any) {
        this._defaults[key] = value

        return this
    }

    /**
     * Set the default values for the route.
     *
     * @param  defaults
     */
    setDefaults (defaults: Record<string, any>) {
        this._defaults = defaults

        return this
    }

    /**
     * Get the optional parameter names for the route.
     */
    getOptionalParameterNames (): Record<string, null> {
        const matches = [...this.uri().matchAll(/\{([\w:]+?)\??\}/g)]
        if (!matches.length) return {}

        const result: Record<string, null> = {}
        for (const match of matches) {
            result[match[1]] = null
        }

        return result
    }

    /**
     * Get all of the parameter names for the route.
     */
    parameterNames () {
        if (this.#parameterNames) {
            return this.#parameterNames
        }

        return this.#parameterNames = this.compileParameterNames()
    }

    /**
     * Checks whether the route's action is a controller.
     */
    protected isControllerAction () {
        return !!this.action.uses && isClass(this.action.uses)
    }

    protected compileParameterNames (): string[] {
        const pattern = /\{([\w:]+?)\??\}/g
        const fullUri = (this.getDomain() ?? '') + this.uri
        const matches = [...fullUri.matchAll(pattern)]

        return matches.map(m => m[1])
    }

    /**
     * Compile the route once, cache the result, return compiled data
     */
    compileRoute (): CompiledRoute {
        if (!this.compiled) {
            const optionalParams = this.getOptionalParameterNames()
            const paramNames: string[] = []

            // extract all param names in order
            this.uri().replace(/\{([\w:]+?)\??\}/g, (_, paramName) => {
                paramNames.push(paramName)
                return ''
            })

            this.compiled = new CompiledRoute(this.uri(), paramNames, optionalParams)
        }

        return this.compiled
    }

    /**
     * Get the value of the action that should be taken on a missing model exception.
     */
    getMissing (): CallableConstructor | undefined {
        return this.action['missing'] ?? undefined
    }

    /**
     * The route path that can be handled by H3.
     */
    getPath (): string {
        return this.path
    }

    /**
     * Define the callable that should be invoked on a missing model exception.
     *
     * @param  missing
     */
    missing (missing: CallableConstructor): this {
        this.action['missing'] = missing

        return this
    }

    /**
     * Specify middleware that should be removed from the given route.
     *
     * @param  middleware
     */
    withoutMiddleware (middleware: any): this {
        this.action.excluded_middleware = Object.assign({},
            this.action.excluded_middleware ?? {},
            Arr.wrap(middleware)
        )

        return this
    }

    /**
     * Get the middleware that should be removed from the route.
     */
    excludedMiddleware (): any {
        return this.action.excluded_middleware ?? {}
    }

    /**
     * Get all middleware, including the ones from the controller.
     */
    gatherMiddleware () {
        if (this.computedMiddleware) {
            return this.computedMiddleware
        }

        this.computedMiddleware = []

        return this.computedMiddleware = Router.uniqueMiddleware([...this.middleware(), ...this.controllerMiddleware()])
    }

    /**
     * Get the dispatcher for the route's controller.
     *
     * @throws {BindingResolutionException}
     */
    controllerDispatcher () {
        if (this.container.bound(IControllerDispatcher)) {
            return this.container.make(IControllerDispatcher)
        }

        return new ControllerDispatcher(this.container)
    }

    /**
     * Run the route action and return the response.
     *
     * @return mixed
     * @throws  {NotFoundHttpException}
     */
    protected async runController () {
        return await this.controllerDispatcher().dispatch(
            this,
            this.getController()!,
            this.getControllerMethod()
        )
    }

    protected async runCallable () {
        const callable = this.action.uses

        return new CallableDispatcher(this.container).dispatch(this, callable)
    }

    /**
     * Get the controller instance for the route.
     *
     * @return mixed
     *
     * @throws {BindingResolutionException}
     */
    getController () {
        if (!this.isControllerAction()) {
            return undefined
        }

        if (!this.controller) {
            const instance = this.getControllerClass()

            this.controller = this.container.make(instance)
        }

        return this.controller
    }

    /**
     * Flush the cached container instance on the route.
     */
    flushController () {
        this.computedMiddleware = undefined
        this.controller = undefined
    }

    /**
     * Get the controller class used for the route.
     */
    getControllerClass () {
        return this.isControllerAction() ? this.action.uses : undefined
    }

    /**
     * Get the controller method used for the route.
     */
    getControllerMethod (): ControllerMethod {
        const holder = isClass(this.action.uses) && typeof this.action.controller === 'string' ? this.action.controller : 'index'
        return Str.parseCallback(holder)[1] as ControllerMethod
    }

    /**
     * Get the middleware for the route's controller.
     *
     * @return array
     */
    controllerMiddleware () {
        let controllerClass: string | undefined, controllerMethod: string | undefined

        if (!this.isControllerAction()) {
            return []
        }

        if (typeof this.action.uses === 'string') {
            [controllerClass, controllerMethod] = [
                this.getControllerClass(),
                this.getControllerMethod(),
            ]
        } else {
            //
        }

        console.log(controllerClass, controllerMethod, this.action, 'controllerMiddleware')
        // if (is_a(controllerClass, HasMiddleware.lass, true)) {
        //     return this.staticallyProvidedControllerMiddleware(
        //         controllerClass,
        //         controllerMethod
        //     )
        // }

        // if (method_exists(Object.prototype.hasOwnProperty.call(controllerClass, 'getMiddleware')) {
        //     return this.controllerDispatcher().getMiddleware(
        //         this.getController(),
        //         controllerMethod
        //     )
        // }

        return []
    }
}