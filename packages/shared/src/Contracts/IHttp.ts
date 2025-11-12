import type { H3Event, Middleware, MiddlewareOptions } from 'h3'

import { IApplication } from './IApplication'
import { IRequest } from './IRequest'
import { IResponse } from './IResponse'

export type RouterEnd = 'get' | 'delete' | 'put' | 'post' | 'patch' | 'apiResource' | 'group' | 'route';
export type RequestMethod = 'HEAD' | 'GET' | 'PUT' | 'DELETE' | 'TRACE' | 'OPTIONS' | 'PURGE' | 'POST' | 'CONNECT' | 'PATCH';
export type RequestObject = Record<string, any>;
export type ResponseObject = Record<string, any>;

export type ExtractControllerMethods<T> = {
    [K in keyof T]: T[K] extends (...args: any[]) => any ? K : never
}[keyof T];

/**
 * Interface for the Router contract, defining methods for HTTP routing.
 */
export declare class IRouter {
    /**
     * Registers a GET route.
     * @param path - The route path.
     * @param definition - The handler function or [controller class, method] array.
     * @param name - Optional route name.
     * @param middleware - Optional middleware array.
     */
    get<C extends new (...args: any) => any> (
        path: string,
        definition: EventHandler | [C, methodName: ExtractControllerMethods<InstanceType<C>>],
        name?: string,
        middleware?: IMiddleware[]
    ): Omit<this, RouterEnd>;

    /**
     * Registers a POST route.
     * @param path - The route path.
     * @param definition - The handler function or [controller class, method] array.
     * @param name - Optional route name.
     * @param middleware - Optional middleware array.
     */
    post<C extends new (...args: any) => any> (
        path: string,
        definition: EventHandler | [C, methodName: ExtractControllerMethods<InstanceType<C>>],
        name?: string,
        middleware?: IMiddleware[]
    ): Omit<this, RouterEnd>;

    /**
     * Registers a PUT route.
     * @param path - The route path.
     * @param definition - The handler function or [controller class, method] array.
     * @param name - Optional route name.
     * @param middleware - Optional middleware array.
     */
    put<C extends new (...args: any) => any> (
        path: string,
        definition: EventHandler | [C, methodName: ExtractControllerMethods<InstanceType<C>>],
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
    patch<C extends new (...args: any) => any> (
        path: string,
        definition: EventHandler | [C, methodName: ExtractControllerMethods<InstanceType<C>>],
        name?: string,
        middleware?: IMiddleware[]
    ): Omit<this, RouterEnd>;

    /**
     * Registers a DELETE route.
     * @param path - The route path.
     * @param definition - The handler function or [controller class, method] array.
     * @param name - Optional route name.
     * @param middleware - Optional middleware array.
     */
    delete<C extends new (...args: any) => any> (
        path: string,
        definition: EventHandler | [C, methodName: ExtractControllerMethods<InstanceType<C>>],
        name?: string,
        middleware?: IMiddleware[]
    ): Omit<this, RouterEnd>;

    /**
     * Registers an API resource with standard CRUD routes.
     * @param path - The base path for the resource.
     * @param controller - The controller class handling the resource.
     * @param middleware - Optional middleware array.
     */
    apiResource (
        path: string,
        controller: new (app: IApplication) => IController,
        middleware?: IMiddleware[]
    ): Omit<this, RouterEnd | 'name'>;

    /**
     * Generates a URL for a named route.
     * @param name - The name of the route.
     * @param params - Optional parameters to replace in the route path.
     * @returns The generated URL or undefined if the route is not found.
     */
    route (name: string, params?: Record<string, string>): string | undefined;


    /**
     * Set the name of the current route
     * 
     * @param name 
     */
    name (name: string): this

    /**
     * Groups routes with shared prefix or middleware.
     * @param options - Configuration for prefix or middleware.
     * @param callback - Callback function defining grouped routes.
     */
    group (options: { prefix?: string; middleware?: EventHandler[] }, callback: () => this): this;

    /**
     * Registers middleware for a specific path.
     * @param path - The path to apply the middleware.
     * @param handler - The middleware handler.
     * @param opts - Optional middleware options.
     */
    middleware (path: Middleware, opts?: Middleware | MiddlewareOptions): this
    middleware (path: string | IMiddleware[] | Middleware, handler: Middleware | MiddlewareOptions, opts?: MiddlewareOptions): this;
}

/**
 * Represents the HTTP context for a single request lifecycle.
 * Encapsulates the application instance, request, and response objects.
 */
export declare class HttpContext {
    app: IApplication
    event: H3Event
    request: IRequest
    response: IResponse
    private static contexts: WeakMap<any, HttpContext>
    constructor(app: IApplication, request: IRequest, response: IResponse);
    /**
     * Factory method to create a new HttpContext instance from a context object.
     * @param ctx - Object containing app, request, and response
     * @returns A new HttpContext instance
     */
    static init (ctx: {
        app: IApplication;
        request: IRequest;
        response: IResponse;
    }, event?: unknown): HttpContext;
    /**
     * Retrieve an existing HttpContext instance for an event, if any.
     */
    static get (event: unknown): HttpContext | undefined;
    /**
     * Delete the cached context for a given event (optional cleanup).
     */
    static forget (event: unknown): void;
}

/**
 * Type for EventHandler, representing a function that handles an H3 event.
 */
export type EventHandler = (ctx: HttpContext) => any
export type RouteEventHandler = (...args: any[]) => any

/**
 * Defines the contract for all controllers.
 * Any controller implementing this must define these methods.
 */
export declare class IController {
    show?(...ctx: any[]): any
    index?(...ctx: any[]): any
    store?(...ctx: any[]): any
    update?(...ctx: any[]): any
    destroy?(...ctx: any[]): any
}

/**
 * Defines the contract for all middlewares.
 * Any middleware implementing this must define these methods.
 */
export declare class IMiddleware {
    handle (context: HttpContext, next: () => Promise<any>): Promise<any>
} 
