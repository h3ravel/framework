import type { CallableConstructor, RouteActions, RouteMethod } from '../Utilities/Utilities'

import type { ICompiledRoute } from './ICompiledRoute'
import type { IContainer } from '../Core/IContainer'
import { IController } from '../Core/IController'
import { IRequest } from '../Http/IRequest'

export abstract class IRoute {
    /**
     * The default values for the route.
     */
    public abstract _defaults: Record<string, any>
    /**
     * The compiled version of the route.
     */
    public abstract compiled?: ICompiledRoute
    /**
     * The array of matched parameters.
     */
    public abstract parameters?: Record<string, any>
    /**
     * The route action array.
     */
    public abstract action: RouteActions
    /**
     * The HTTP methods the route responds to.
     */
    public abstract methods: RouteMethod[]
    /**
     * The route path that can be handled by H3.
     */
    public abstract path: string
    /**
     * The computed gathered middleware.
     */
    public abstract computedMiddleware?: Record<string, any>
    /**
     * The controller instance.
     */
    public abstract controller?: Required<IController>
    /**
     * Set the router instance on the route.
     *
     * @param router
     */
    abstract setRouter (router: any): this;
    /**
     * Set the container instance on the route.
     *
     * @param container
     */
    abstract setContainer (container: IContainer): this;
    /**
     * Set the URI that the route responds to.
     *
     * @param uri
     */
    abstract setUri (uri: string): this;
    /**
     * Get the URI associated with the route.
     */
    abstract uri (): string;
    /**
     * Add a prefix to the route URI.
     *
     * @param prefix
     */
    abstract prefix (prefix: string): this;
    /**
     * Get the name of the route instance.
     */
    abstract getName (): string | undefined;
    /**
     * Add or change the route name.
     *
     * @param  name
     *
     * @throws {InvalidArgumentException}
     */
    abstract name (name: string): this;
    /**
     * Determine whether the route's name matches the given patterns.
     *
     * @param patterns
     */
    abstract named (...patterns: string[]): boolean;
    /**
     * Get the action name for the route.
     */
    abstract getActionName (): any;
    /**
     * Get the method name of the route action.
     *
     * @return string
     */
    abstract getActionMethod (): any;
    /**
     * Get the action array or one of its properties for the route.
     * @param key
     */
    abstract getAction (key?: string): any;
    /**
     * Mark this route as a fallback route.
     */
    abstract fallback (): this
    /**
     * Set the fallback value.
     *
     * @param  sFallback
     */
    abstract setFallback (isFallback: boolean): this
    /**
     * Get the HTTP verbs the route responds to.
     */
    abstract getMethods (): RouteMethod[]
    /**
     * Determine if the route only responds to HTTP requests.
     */
    abstract httpOnly (): boolean;
    /**
     * Determine if the route only responds to HTTPS requests.
     */
    abstract httpsOnly (): boolean
    /**
     * Get or set the middlewares attached to the route.
     *
     * @param  array|string|null  $middleware
     * @return $this|array
     */
    abstract middleware (middleware?: string | string[]): any[] | this;
    /**
     * Specify that the "Authorize" / "can" middleware should be applied to the route with the given options.
     *
     * @param  ability
     * @param  models
     */
    abstract can (ability: string, models?: string | string[]): any[] | this;
    /**
     * Set the action array for the route.
     *
     * @param action
     */
    abstract setAction (action: RouteActions): this;
    /**
     * Determine if the route only responds to HTTPS requests.
     */
    abstract secure (): boolean;
    /**
     * Bind the route to a given request for execution.
     *
     * @param request
     */
    abstract bind (request: IRequest): this;
    /**
     * Get or set the domain for the route.
     *
     * @param domain
     *
     * @throws {InvalidArgumentException}
     */
    abstract domain<D extends string | undefined = undefined> (domain?: D): D extends undefined ? string : this;
    /**
     * Get the key / value list of original parameters for the route.
     *
     * @throws {LogicException}
     */
    abstract originalParameters (): Record<string, any>;
    /**
     * Get the matched parameters object.
     */
    abstract getParameters (): Record<string, any>
    /**
     * Get a given parameter from the route.
     *
     * @param  name
     * @param  defaultParam
     */
    abstract parameter (name: string, defaultParam?: any): any
    /**
     * Get the domain defined for the route.
     */
    abstract getDomain (): string | undefined;
    /**
     * Get the compiled version of the route.
     */
    abstract getCompiled (): ICompiledRoute | undefined;
    /**
     * Set a default value for the route.
     *
     * @param  key
     * @param  value
     */
    abstract defaults (key: string, value: any): this;
    /**
     * Set the default values for the route.
     *
     * @param  defaults
     */
    abstract setDefaults (defaults: Record<string, any>): this;
    /**
     * Get the optional parameter names for the route.
     */
    abstract getOptionalParameterNames (): Record<string, null>;
    /**
     * Get all of the parameter names for the route.
     */
    abstract parameterNames (): string[];
    /**
     * Flush the cached container instance on the route.
     */
    abstract flushController (): void
    /**
     * Compile the route once, cache the result, return compiled data
     */
    abstract compileRoute (): ICompiledRoute;
    /**
     * Get the value of the action that should be taken on a missing model exception.
     */
    abstract getMissing (): CallableConstructor | undefined
    /**
     * The route path that can be handled by H3.
     */
    abstract getPath (): string
    /**
     * Define the callable that should be invoked on a missing model exception.
     *
     * @param  missing
     */
    abstract missing (missing: CallableConstructor): this
    /**
     * Specify middleware that should be removed from the given route.
     *
     * @param  middleware
     */
    abstract withoutMiddleware (middleware: any): this
    /**
     * Get the middleware that should be removed from the route.
     */
    abstract excludedMiddleware (): any
    /**
     * Get all middleware, including the ones from the controller.
     */
    abstract gatherMiddleware (): Record<string, any>
} 