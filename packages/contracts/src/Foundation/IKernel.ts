import { IApplication } from '../Core/IApplication'
import { IMiddleware } from '../Routing/IMiddleware'
import { IRequest } from '../Http/IRequest'
import { IResponse } from '../Http/IResponse'
import { MiddlewareList } from './MiddlewareContract'

export abstract class IKernel {
    /**
     * Handle an incoming HTTP request.
     *
     * @param request
     */
    abstract handle (request: IRequest): Promise<IResponse | undefined>;

    /**
     * Bootstrap the application for HTTP requests.
     *
     * @return void
     */
    abstract bootstrap (): void;

    /**
     * Call the terminate method on any terminable middleware.
     *
     * @param request
     * @param  response
     */
    abstract terminate (request: IRequest, response: IResponse): void;

    /**
     * Register a callback to be invoked when the requests lifecycle duration exceeds a given amount of time.
     *
     * @param {number | DateTime} threshold 
     * @param  handler
     */
    abstract whenRequestLifecycleIsLongerThan (threshold: any, handler: (...args: any[]) => any): void;

    /**
     * When the request being handled started.
     * 
     * @returns {DateTime}
     */
    abstract requestStartedAt (): any;

    /**
     * Determine if the kernel has a given middleware.
     *
     * @param middleware
     */
    abstract hasMiddleware (middleware: IMiddleware): boolean;
    /**
     * Add a new middleware to the beginning of the stack if it does not already exist.
     *
     * @param  string  middleware
     */
    abstract prependMiddleware (middleware: IMiddleware): this;
    /**
     * Add a new middleware to end of the stack if it does not already exist.
     *
     * @param  middleware
     */
    abstract pushMiddleware (middleware: IMiddleware): this;
    /**
     * Prepend the given middleware to the given middleware group.
     *
     * @param    group
     * @param    middleware
     *
     * @throws {InvalidArgumentException}
     */
    abstract prependMiddlewareToGroup (group: string, middleware: IMiddleware): this;
    /**
     * Append the given middleware to the given middleware group.
     *
     * @param  group
     * @param  middleware
     *
     * @throws {InvalidArgumentException}
     */
    abstract appendMiddlewareToGroup (group: string, middleware: IMiddleware): this;
    /**
     * Prepend the given middleware to the middleware priority list.
     *
     * @param  middleware
     */
    abstract prependToMiddlewarePriority (middleware: IMiddleware): this;
    /**
     * Append the given middleware to the middleware priority list.
     *
     * @param  string  $middleware
     * @return $this
     */
    abstract appendToMiddlewarePriority (middleware: IMiddleware): this;
    /**
     * Add the given middleware to the middleware priority list before other middleware.
     *
     * @param  before
     * @param  string  $middleware
     * @return $this
     */
    abstract addToMiddlewarePriorityBefore (before: IMiddleware | IMiddleware[], middleware: IMiddleware): this;
    /**
     * Add the given middleware to the middleware priority list after other middleware.
     *
     * @param after
     * @param middleware
     */
    abstract addToMiddlewarePriorityAfter (after: IMiddleware | IMiddleware[], middleware: IMiddleware): this;

    /**
     * Get the priority-sorted list of middleware.
     *
     * @return array
     */
    abstract getMiddlewarePriority (): MiddlewareList;

    /**
     * Get the application's global middleware.
     *
     * @return array
     */
    abstract getGlobalMiddleware (): MiddlewareList;
    /**
     * Set the application's global middleware.
     *
     * @param middleware
     * @returns
     */
    abstract setGlobalMiddleware (middleware: MiddlewareList): this;
    /**
     * Get the application's route middleware groups.
     *
     * @return array
     */
    abstract getMiddlewareGroups (): Record<string, MiddlewareList>;
    /**
     * Set the application's middleware groups.
     *
     * @param groups
     * @returns
     */
    abstract setMiddlewareGroups (groups: Record<string, MiddlewareList>): this;
    /**
     * Get the application's route middleware aliases.
     *
     * @return array
     */
    abstract getMiddlewareAliases (): Record<string, IMiddleware>;
    /**
     * Set the application's route middleware aliases.
     *
     * @param  aliases
     */
    abstract setMiddlewareAliases (aliases: Record<string, IMiddleware>): this;
    /**
     * Set the application's middleware priority.
     *
     * @param priority
     */
    abstract setMiddlewarePriority (priority: MiddlewareList): this;
    /**
     * Get the Laravel application instance.
     */
    abstract getApplication (): IApplication;
    /**
     * Set the Laravel application instance.
     *
     * @param app
     */
    abstract setApplication (app: IApplication): this;
}