import type { ActionInput, CallableConstructor, GenericObject, ResourceOptions, RouteActions, RouteMethod } from '../Utilities/Utilities'
import { IResponse, ResponsableType } from '../Http/IResponse'
import type { Middleware, MiddlewareOptions } from 'h3'

import type { IController } from '../Core/IController'
import type { IMiddleware } from './IMiddleware'
import { IPendingResourceRegistration } from './IPendingResourceRegistration'
import { IPendingSingletonResourceRegistration } from './IPendingSingletonResourceRegistration'
import { IRequest } from '../Http/IRequest'
import type { IRoute } from './IRoute'
import type { IRouteCollection } from './IRouteCollection'
import { MiddlewareList } from '../Foundation/MiddlewareContract'

/**
 * Interface for the Router contract, defining methods for HTTP routing.
 */
export abstract class IRouter {
    /**
     * The priority-sorted list of middleware.
     *
     * Forces the listed middleware to always be in the given order.
     */
    public abstract middlewarePriority: MiddlewareList
    /**
     * All of the verbs supported by the router.
     */
    static verbs: RouteMethod[]
    /**
     * Get the currently dispatched route instance.
     */
    abstract getCurrentRoute (): IRoute | undefined;
    /**
     * Check if a route with the given name exists.
     *
     * @param name
     */
    abstract has (...name: string[]): boolean;
    /**
     * Get the current route name.
     */
    abstract currentRouteName (): string | undefined;
    /**
     * Alias for the "currentRouteNamed" method.
     *
     * @param  patterns
     */
    abstract is (...patterns: string[]): boolean;
    /**
     * Determine if the current route matches a pattern.
     *
     * @param patterns
     */
    abstract currentRouteNamed (...patterns: string[]): boolean;
    /**
     * Get the underlying route collection.
     */
    abstract getRoutes (): IRouteCollection;
    /**
     * Create a new IRoute object.
     *
     * @param  methods
     * @param  uri
     * @param  action
     */
    abstract newRoute (methods: RouteMethod | RouteMethod[], uri: string, action: ActionInput): IRoute;
    /**
     * Dispatch the request to the application.
     *
     * @param request
     */
    abstract dispatch (request: IRequest): Promise<IResponse>;
    /**
     * Dispatch the request to a route and return the response.
     *
     * @param request
     */
    abstract dispatchToRoute (request: IRequest): Promise<IResponse>;
    /**
     * Registers a route that responds to HTTP GET requests.
     * 
     * @param uri - The route uri.
     * @param action - The handler function or [controller class, method] array.
     * @returns 
     */
    abstract get<C extends typeof IController> (uri: string, action: ActionInput<C>): IRoute
    /**
     * Registers a route that responds to HTTP POST requests.
     * 
     * @param uri - The route uri.
     * @param action - The handler function or [controller class, method] array.
     * @returns 
     */
    abstract post<C extends typeof IController> (uri: string, action: ActionInput<C>): IRoute
    /**
     * Registers a route that responds to HTTP PUT requests.
     * 
     * @param uri - The route uri.
     * @param action - The handler function or [controller class, method] array.
     * @returns 
     */
    abstract put<C extends typeof IController> (uri: string, action: ActionInput<C>): IRoute
    /**
     * Registers a route that responds to HTTP PATCH requests.
     * 
     * @param uri - The route uri.
     * @param action - The handler function or [controller class, method] array.
     * @returns 
     */
    abstract patch<C extends typeof IController> (uri: string, action: ActionInput<C>): IRoute
    /**
     * Registers a route that responds to HTTP DELETE requests.
     * 
     * @param uri - The route uri.
     * @param action - The handler function or [controller class, method] array.
     * @returns 
     */
    abstract delete<C extends typeof IController> (uri: string, action: ActionInput<C>): IRoute
    /**
     * Registers a route the matches the provided methods.
     * 
     * @param methods - The route methods to match.
     * @param uri - The route uri.
     * @param action - The handler function or [controller class, method] array.
     */
    abstract match<C extends typeof IController> (
        methods: RouteMethod | RouteMethod[],
        uri: string,
        action: ActionInput<C>
    ): IRoute;
    /**
     * Route a resource to a controller.
     *
     * @param  name
     * @param  controller
     * @param  options
     */
    abstract resource<C extends typeof IController> (name: string, controller: C, options: ResourceOptions): IPendingResourceRegistration
    /**
     * Register an array of API resource controllers.
     *
     * @param  resources
     * @param  options
     */
    abstract apiResources (resources: GenericObject<typeof IController>, options: ResourceOptions): void
    /**
     * API Resource support
     *
     * @param path
     * @param controller
     */
    abstract apiResource<C extends typeof IController> (name: string, controller: C, options: ResourceOptions): IPendingResourceRegistration

    /**
     * Register an array of singleton resource controllers.
     *
     * @param  singletons
     * @param  options
     */
    abstract singletons (singletons: GenericObject<typeof IController>, options: ResourceOptions): void
    /**
     * Route a singleton resource to a controller.
     *
     * @param  name
     * @param  controller
     * @param  options
     */
    abstract singleton<C extends typeof IController> (name: string, controller: C, options: ResourceOptions): IPendingSingletonResourceRegistration

    /**
     * Register an array of API singleton resource controllers.
     *
     * @param  singletons
     * @param  options
     */
    abstract apiSingletons (singletons: GenericObject<typeof IController>, options: ResourceOptions): void
    /**
     * Route an API singleton resource to a controller.
     *
     * @param  name
     * @param  controller
     * @param  options
     */
    abstract apiSingleton<C extends typeof IController> (name: string, controller: C, options: ResourceOptions): IPendingSingletonResourceRegistration
    /**
     * Grouping
     *
     * @param options
     * @param callback
     */
    /**
     * Create a route group with shared attributes.
     *
     * @param  attributes
     * @param  routes
     */
    abstract group<C extends ((_e: this) => void) | string> (attributes: RouteActions, routes: C | C[]): this;
    /**
     * Merge the given array with the last group stack.
     *
     * @param  newItems
     * @param  prependExistingPrefix
     */
    abstract mergeWithLastGroup (newItems: RouteActions, prependExistingPrefix?: boolean): RouteActions;
    /**
     * Get the prefix from the last group on the stack.
     */
    abstract getLastGroupPrefix (): any;
    /**
     * Determine if the router currently has a group stack.
     */
    abstract hasGroupStack (): boolean;
    /**
     * Set the name of the current route
     *
     * @param name
     */
    abstract name (name: string): this;
    /**
     * Registers middleware for a specific path.
     * @param path - The path to apply the middleware.
     * @param handler - The middleware handler.
     * @param opts - Optional middleware options.
     */
    abstract h3middleware (
        path: string | IMiddleware[] | Middleware,
        handler?: Middleware | MiddlewareOptions,
        opts?: MiddlewareOptions
    ): this;
    /**
     * Get all of the defined middleware short-hand names.
     */
    abstract getMiddleware (): GenericObject
    /**
     * Register a short-hand name for a middleware.
     *
     * @param  name
     * @param  class
     */
    abstract aliasMiddleware (name: string, cls: IMiddleware): this
    /**
     * Gather the middleware for the given route with resolved class names.
     *
     * @param  route
     */
    abstract gatherRouteMiddleware (route: IRoute): any
    /**
     * Resolve a flat array of middleware classes from the provided array.
     *
     * @param middleware
     * @param excluded
     */
    abstract resolveMiddleware (middleware: MiddlewareList, excluded: MiddlewareList): any
    /**
     * Register a group of middleware.
     *
     * @param  name
     * @param  middleware
     */
    abstract middlewareGroup (name: string, middleware: MiddlewareList): this

    /**
     * Register a group of middleware.
     *
     * @param  name
     * @param  middleware
     */
    abstract middlewareGroup (name: string, middleware: MiddlewareList): this

    /**
     * Create a response instance from the given value.
     *
     * @param  request
     * @param  response
     */
    abstract prepareResponse (request: IRequest, response: ResponsableType): Promise<IResponse>

    /**
     * Substitute the route bindings onto the route.
     *
     * @param  route
     *
     * @throws {ModelNotFoundException<IModel>}
     */
    abstract substituteBindings (route: IRoute): Promise<IRoute>

    /**
     * Substitute the implicit route bindings for the given route.
     *
     * @param  route
     *
     * @throws {ModelNotFoundException<IModel>}
     */
    abstract substituteImplicitBindings (route: IRoute): Promise<any | undefined>

    /**
     * Register a callback to run after implicit bindings are substituted.
     *
     * @param  callback
     */
    abstract substituteImplicitBindingsUsing (callback: CallableConstructor): this
}