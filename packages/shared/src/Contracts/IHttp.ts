import type { Middleware, MiddlewareOptions } from "h3";

import { IApplication } from "./IApplication";
import { IRequest } from "./IRequest";
import { IResponse } from "./IResponse";

/**
 * Interface for the Router contract, defining methods for HTTP routing.
 */
export interface IRouter {
    /**
     * Registers a GET route.
     * @param path - The route path.
     * @param handler - The handler function or controller class.
     * @param methodName - Optional controller method name.
     * @param name - Optional route name.
     * @param middleware - Optional middleware array.
     */
    get (
        path: string,
        handler: EventHandler | (new (...args: any[]) => IController),
        methodName?: string,
        name?: string,
        middleware?: IMiddleware[]
    ): void;

    /**
     * Registers a POST route.
     * @param path - The route path.
     * @param handler - The handler function or controller class.
     * @param methodName - Optional controller method name.
     * @param name - Optional route name.
     * @param middleware - Optional middleware array.
     */
    post (
        path: string,
        handler: EventHandler | (new (...args: any[]) => IController),
        methodName?: string,
        name?: string,
        middleware?: IMiddleware[]
    ): void;

    /**
     * Registers a PUT route.
     * @param path - The route path.
     * @param handler - The handler function or controller class.
     * @param methodName - Optional controller method name.
     * @param name - Optional route name.
     * @param middleware - Optional middleware array.
     */
    put (
        path: string,
        handler: EventHandler | (new (...args: any[]) => IController),
        methodName?: string,
        name?: string,
        middleware?: IMiddleware[]
    ): void;

    /**
     * Registers a DELETE route.
     * @param path - The route path.
     * @param handler - The handler function or controller class.
     * @param methodName - Optional controller method name.
     * @param name - Optional route name.
     * @param middleware - Optional middleware array.
     */
    delete (
        path: string,
        handler: EventHandler | (new (...args: any[]) => IController),
        methodName?: string,
        name?: string,
        middleware?: IMiddleware[]
    ): void;

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
    ): void;

    /**
     * Generates a URL for a named route.
     * @param name - The name of the route.
     * @param params - Optional parameters to replace in the route path.
     * @returns The generated URL or undefined if the route is not found.
     */
    route (name: string, params?: Record<string, string>): string | undefined;

    /**
     * Groups routes with shared prefix or middleware.
     * @param options - Configuration for prefix or middleware.
     * @param callback - Callback function defining grouped routes.
     */
    group (options: { prefix?: string; middleware?: EventHandler[] }, callback: () => void): void;

    /**
     * Registers middleware for a specific path.
     * @param path - The path to apply the middleware.
     * @param handler - The middleware handler.
     * @param opts - Optional middleware options.
     */
    middleware (path: string, handler: Middleware, opts?: MiddlewareOptions): void;
}

export interface HttpContext {
    request: IRequest
    response: IResponse
}

/**
 * Type for EventHandler, representing a function that handles an H3 event.
 */
export type EventHandler = (ctx: HttpContext) => any

/**
 * Defines the contract for all controllers.
 * Any controller implementing this must define these methods.
 */
export interface IController {
    show (ctx: HttpContext): any
    index (ctx: HttpContext): any
    store (ctx: HttpContext): any
    update (ctx: HttpContext): any
    destroy (ctx: HttpContext): any
}

/**
 * Defines the contract for all middlewares.
 * Any middleware implementing this must define these methods.
 */
export interface IMiddleware {
    handle (context: HttpContext, next: () => Promise<any>): Promise<any>
} 
