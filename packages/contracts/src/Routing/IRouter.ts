import type { Middleware, MiddlewareOptions } from 'h3'
import type { IRoute } from './IRoute'
import type { IRouteCollection } from './IRouteCollection'
import type { IController } from '../Core/IController'
import type { IMiddleware } from './IMiddleware'
import type { ActionInput, RouteEventHandler, RouteActions, RouteMethod, ExtractClassMethods, RouterEnd } from '../Utilities/Utilities'
import { IRequest } from '../Http/IRequest'
import { MiddlewareList } from '../Foundation/MiddlewareContract'
import { IResponse } from '../Http/IResponse'

/**
 * Interface for the Router contract, defining methods for HTTP routing.
 */
export abstract class IRouter {
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
     * @param path        The URL pattern to match (can include parameters, e.g., '/users/:id').
     * @param definition  Either:
     *                      - An EventHandler function
     *                      - A tuple: [ControllerClass, methodName]
     * @param name        Optional route name (for URL generation or referencing).
     * @param middleware  Optional array of middleware functions to execute before the handler.
     */
    abstract get<C extends new (...args: any) => any> (
        path: string,
        definition: RouteEventHandler | [C, methodName: ExtractClassMethods<InstanceType<C>>],
        name?: string,
        middleware?: IMiddleware[]
    ): Omit<this, RouterEnd>;
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
    abstract post<C extends new (...args: any) => any> (
        path: string,
        definition: RouteEventHandler | [C, methodName: ExtractClassMethods<InstanceType<C>>],
        name?: string, middleware?: IMiddleware[]
    ): Omit<this, RouterEnd>;
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
    abstract put<C extends new (...args: any) => any> (
        path: string,
        definition: RouteEventHandler | [C, methodName: ExtractClassMethods<InstanceType<C>>],
        name?: string,
        middleware?: IMiddleware[]
    ): Omit<this, RouterEnd>;
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
    abstract patch<C extends new (...args: any) => any> (
        path: string,
        definition: RouteEventHandler | [C, methodName: ExtractClassMethods<InstanceType<C>>],
        name?: string,
        middleware?: IMiddleware[]
    ): Omit<this, RouterEnd>;
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
    abstract delete<C extends new (...args: any) => any> (
        path: string,
        definition: RouteEventHandler | [C, methodName: ExtractClassMethods<InstanceType<C>>],
        name?: string,
        middleware?: IMiddleware[]
    ): Omit<this, RouterEnd>;
    /**
     * API Resource support
     *
     * @param path
     * @param controller
     */
    abstract apiResource<C extends new (...args: any) => any> (
        path: string,
        Controller: C, middleware?: IMiddleware[]
    ): Omit<this, RouterEnd | 'name'>;
    /**
     * Registers a route the matches the provided methods.
     * @param methods - The route methods to match.
     * @param uri - The route uri.
     * @param action - The handler function or [controller class, method] array.
     */
    abstract match<C extends typeof IController> (
        methods: Lowercase<RouteMethod>[],
        uri: string,
        action: ActionInput<C>
    ): IRoute;
    /**
     * Named route URL generator
     *
     * @param name
     * @param params
     * @returns
     */
    abstract route (name: string, params?: Record<string, string>): string | undefined;
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
    abstract middleware (
        path: string | IMiddleware[] | Middleware,
        handler: Middleware | MiddlewareOptions,
        opts?: MiddlewareOptions
    ): this;

    /**
     * Register a group of middleware.
     *
     * @param  name
     * @param  middleware
     */
    abstract middlewareGroup (name: string, middleware: MiddlewareList): this
}