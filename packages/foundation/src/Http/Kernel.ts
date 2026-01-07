// namespace Illuminate\Foundation\Http;

import { Arr, DateTime, InvalidArgumentException } from '@h3ravel/support'
import { ConcreteConstructor, IApplication, IBootstraper, IExceptionHandler, IKernel, IMiddleware, IRequest, IResponse, IRouter, MiddlewareIdentifier, MiddlewareList } from '@h3ravel/contracts'

import { Facades } from '@h3ravel/support/facades'
import { Injectable } from '..'
import { RegisterFacades } from '../Bootstrapers/RegisterFacades'
import { RequestHandled } from './Events/RequestHandled'
import { Terminating } from '../Core/Events/Terminating'

@Injectable()
export class Kernel extends IKernel {
    /**
     * The bootstrap classes for the application.
     */
    #bootstrappers: ConcreteConstructor<IBootstraper>[] = [
        RegisterFacades
    ]

    /**
     * The application's middleware stack.
     */
    protected middleware: MiddlewareList = []

    /**
     * The application's route middleware groups.
     */
    protected middlewareGroups: Record<string, MiddlewareList> = {}

    /**
     * The application's middleware aliases.
     */
    protected middlewareAliases: Record<string, IMiddleware> = {}

    /**
     * All of the registered request duration handlers.
     */
    protected requestLifecycleDurationHandlers: {
        threshold?: number
        handler?: (...args: any[]) => void
    }[] = []

    /**
     * When the kernel starting handling the current request.
     */
    #requestStartedAt?: DateTime | undefined

    /**
     * The priority-sorted list of middleware.
     *
     * Forces non-global middleware to always be in the given order.
     */
    protected middlewarePriority: MiddlewareList = []

    /**
     * Create a new HTTP kernel instance.
     *
     * @param app The current application instance
     * @param router The current router instance
     */
    constructor(
        protected app: IApplication,
        protected router: IRouter
    ) {
        super()

        this.syncMiddlewareToRouter()
    }

    /**
     * Handle an incoming HTTP request.
     *
     * @param request
     */
    public async handle (request: IRequest) {
        this.#requestStartedAt = new DateTime()

        let response: IResponse | undefined
        try {
            (request.constructor as any).enableHttpMethodParameterOverride()

            response = await this.sendRequestThroughRouter(request)
        } catch (e) {
            this.reportException(e as never)

            response = await this.renderException(request, e as never)
        }

        this.app.make('app.events').dispatch(
            new RequestHandled(request, response)
        )

        return response
    }

    /**
     * Send the given request through the middleware / router.
     *
     * @param request
     */
    protected async sendRequestThroughRouter (request: IRequest): Promise<IResponse> {
        const { Pipeline } = await import('@h3ravel/router')

        this.app.instance('request', request)

        Facades.clearResolvedInstance('request')

        await this.bootstrap()

        return await (new Pipeline(this.app as never))
            .send(request)
            .through(this.app.shouldSkipMiddleware() ? [] : this.middleware)
            .then(this.dispatchToRouter())
    }

    /**
     * Bootstrap the application for HTTP requests.
     *
     * @return void
     */
    async bootstrap () {
        if (!this.app.hasBeenBootstrapped()) {
            await this.app.bootstrapWith(this.bootstrappers())
        }
    }

    /**
     * Get the route dispatcher callback.
     */
    protected dispatchToRouter () {
        return async (request: IRequest) => {
            this.app.instance('request', request)

            return await this.router.dispatch(request)
        }
    }

    /**
     * Call the terminate method on any terminable middleware.
     *
     * @param request
     * @param  response
     */
    public terminate (request: IRequest, response: IResponse): void {
        this.app.make('app.events').dispatch(new Terminating())

        this.terminateMiddleware(request, response)

        // this.app.terminate();

        if (!this.#requestStartedAt) return

        this.#requestStartedAt?.tz(this.app.make('config').get('app.timezone') ?? 'UTC')

        /*
         * Handle duration thresholds
         */
        let end: DateTime

        for (const { threshold, handler } of Object.values(this.requestLifecycleDurationHandlers)) {
            end ??= new DateTime()

            if (!threshold || typeof handler !== 'function') {
                continue
            }

            const diffMs = this.#requestStartedAt?.diff(end, 'milliseconds') ?? 0

            if (diffMs > threshold) {
                handler(this.#requestStartedAt, request, response)
            }
        }

        this.#requestStartedAt = undefined
    }

    /**
     * Call the terminate method on any terminable middleware.
     *
     * @param request
     * @param  response
     */
    protected terminateMiddleware (request: IRequest, response: IResponse) {
        const middlewares: IMiddleware[] | MiddlewareIdentifier[] = this.app.shouldSkipMiddleware() ? [] : [
            ...this.gatherRouteMiddleware(request),
            ...this.middleware
        ]

        //TODO: Handle both stringed and class middleware instances.
        for (const middleware of middlewares) {
            if (typeof middleware !== 'string') continue

            const [name] = this.parseMiddleware(middleware)

            const instance = this.app.make(name as never)

            if (instance['terminate']) {
                instance.terminate(request, response)
            }
        }
    }

    /**
     * Register a callback to be invoked when the requests lifecycle duration exceeds a given amount of time.
     *
     * @param  threshold
     * @param  handler
     */
    public whenRequestLifecycleIsLongerThan (threshold: number | DateTime, handler: (...args: any[]) => any) {
        //TODO: Pay attention to these

        // threshold = threshold instanceof DateTime
        //     ? this.secondsUntil(threshold) * 1000
        //     : threshold

        // this.requestLifecycleDurationHandlers = {
        //     'threshold': threshold,
        //     'handler': handler,
        // }
    }

    /**
     * When the request being handled started.
     */
    public requestStartedAt () {
        return this.#requestStartedAt
    }

    /**
     * Gather the route middleware for the given request. 
     */
    protected gatherRouteMiddleware (request: IRequest) {
        // TODO: Pay attention to this
        // const route = request.route()
        // if (route) {
        //     return this.router.gatherRouteMiddleware(route)
        // }

        return []
    }

    /**
     * Parse a middleware string to get the name and parameters.
     *
     * @param middleware
     */
    protected parseMiddleware (middleware: string): [string, string[]] {
        const parts = middleware.split(':')
        const name = parts[0] ?? ''
        const parameters = parts[1] ? parts[1].split(',') : []

        return [name, parameters]
    }

    /**
     * Determine if the kernel has a given middleware.
     *
     * @param middleware
     */
    public hasMiddleware (middleware: IMiddleware) {
        return this.middleware.includes(middleware)
    }

    /**
     * Add a new middleware to the beginning of the stack if it does not already exist.
     *
     * @param  string  middleware
     */
    public prependMiddleware (middleware: IMiddleware) {
        if (this.middleware.includes(middleware) === false) {
            this.middleware = [middleware, ...this.middleware]
        }

        return this
    }

    /**
     * Add a new middleware to end of the stack if it does not already exist.
     *
     * @param  middleware
     */
    public pushMiddleware (middleware: IMiddleware) {
        if (this.middleware.includes(middleware) === false) {
            this.middleware.push(middleware)
        }

        return this
    }

    /**
     * Prepend the given middleware to the given middleware group.
     *
     * @param    group
     * @param    middleware
     *
     * @throws {InvalidArgumentException}
     */
    public prependMiddlewareToGroup (group: string, middleware: IMiddleware) {
        if (!this.middlewareGroups[group]) {
            throw new InvalidArgumentException('The [{$group}] middleware group has not been defined.')
        }

        if (this.middlewareGroups[group].includes(middleware) === false) {
            this.middlewareGroups[group] = [middleware, ...this.middlewareGroups[group]]
        }

        this.syncMiddlewareToRouter()

        return this
    }

    /**
     * Append the given middleware to the given middleware group.
     *
     * @param  group
     * @param  middleware
     *
     * @throws {InvalidArgumentException}
     */
    public appendMiddlewareToGroup (group: string, middleware: IMiddleware) {
        if (!this.middlewareGroups[group]) {
            throw new InvalidArgumentException('The [{$group}] middleware group has not been defined.')
        }

        if (!this.middlewareGroups[group].includes(middleware)) {
            this.middlewareGroups[group].push(middleware)
        }

        this.syncMiddlewareToRouter()

        return this
    }

    /**
     * Prepend the given middleware to the middleware priority list.
     *
     * @param  middleware
     */
    public prependToMiddlewarePriority (middleware: IMiddleware) {
        if (!this.middlewarePriority.includes(middleware)) {
            this.middlewarePriority = [middleware, ...this.middlewarePriority]
        }

        this.syncMiddlewareToRouter()

        return this
    }

    /**
     * Append the given middleware to the middleware priority list.
     *
     * @param  string  $middleware
     * @return $this
     */
    public appendToMiddlewarePriority (middleware: IMiddleware) {
        if (!this.middlewarePriority.includes(middleware)) {
            this.middlewarePriority.push(middleware)
        }

        this.syncMiddlewareToRouter()

        return this
    }

    /**
     * Add the given middleware to the middleware priority list before other middleware.
     *
     * @param  before
     * @param  string  $middleware
     * @return $this
     */
    public addToMiddlewarePriorityBefore (before: IMiddleware | IMiddleware[], middleware: IMiddleware) {
        return this.addToMiddlewarePriorityRelative(before, middleware, false)
    }

    /**
     * Add the given middleware to the middleware priority list after other middleware.
     *
     * @param after
     * @param middleware
     */
    public addToMiddlewarePriorityAfter (after: IMiddleware | IMiddleware[], middleware: IMiddleware) {
        return this.addToMiddlewarePriorityRelative(after, middleware)
    }

    /**
     * Add the given middleware to the middleware priority list relative to other middleware.
     *
     * @param  string|array  $existing
     * @param  string  $middleware
     * @param  bool  $after
     * @return $this
     */
    protected addToMiddlewarePriorityRelative (existing: IMiddleware | IMiddleware[], middleware: IMiddleware, after = true) {
        if (!this.middlewarePriority.includes(middleware)) {
            let index = after ? 0 : this.middlewarePriority.length

            for (const existingMiddleware of Arr.wrap(existing)) {
                if (this.middlewarePriority.includes(existingMiddleware)) {
                    const middlewareIndex = this.middlewarePriority.indexOf(existingMiddleware)

                    if (after && middlewareIndex > index) {
                        index = middlewareIndex + 1
                    } else if (after === false && middlewareIndex < index) {
                        index = middlewareIndex
                    }
                }
            }

            if (index === 0 && after === false) {
                this.middlewarePriority = [middleware, ...this.middlewarePriority]
            } else if ((after && index === 0) || index === this.middlewarePriority.length) {
                this.middlewarePriority.push(middleware)
            } else {
                this.middlewarePriority.splice(index, 0, middleware)
            }
        }

        this.syncMiddlewareToRouter()

        return this
    }

    /**
     * Sync the current state of the middleware to the router.
     *
     * @return void
     */
    protected syncMiddlewareToRouter () {
        // TODO: Pay Attention to these
        this.router.middlewarePriority = this.middlewarePriority
        for (const [key, middleware] of Object.entries(this.middlewareGroups)) {
            this.router.middlewareGroup(key, middleware)
        }

        for (const [key, middleware] of Object.entries(this.middlewareAliases)) {
            // this.router.aliasMiddleware(key, middleware)
            // console.log(key, middleware, 'key, middleware')
        }
    }

    /**
     * Get the priority-sorted list of middleware.
     *
     * @return array
     */
    public getMiddlewarePriority () {
        return this.middlewarePriority
    }

    /**
     * Get the bootstrap classes for the application.
     *
     * @return array
     */
    protected bootstrappers () {
        return this.#bootstrappers
    }

    /**
     * Report the exception to the exception handler.
     *
     * @param  e
     */
    protected reportException (e: Error) {
        this.app.make(IExceptionHandler).report(e)
    }

    /**
     * Render the exception to a response.
     *
     * @param  request
     * @param  e
     */
    protected renderException (request: IRequest, e: Error) {
        return this.app.make(IExceptionHandler).render(request, e)
    }

    /**
     * Get the application's global middleware.
     *
     * @return array
     */
    public getGlobalMiddleware () {
        return this.middleware
    }

    /**
     * Set the application's global middleware.
     * 
     * @param middleware 
     * @returns 
     */
    public setGlobalMiddleware (middleware: MiddlewareList) {
        this.middleware = middleware

        this.syncMiddlewareToRouter()

        return this
    }

    /**
     * Get the application's route middleware groups.
     *
     * @return array
     */
    public getMiddlewareGroups () {
        return this.middlewareGroups
    }

    /**
     * Set the application's middleware groups.
     * 
     * @param groups 
     * @returns 
     */
    public setMiddlewareGroups (groups: Record<string, MiddlewareList>) {
        this.middlewareGroups = groups
        this.syncMiddlewareToRouter()
        return this
    }

    /**
     * Get the application's route middleware aliases.
     *
     * @return array
     */
    public getMiddlewareAliases () {
        return this.middlewareAliases
    }

    /**
     * Set the application's route middleware aliases.
     *
     * @param  aliases
     */
    public setMiddlewareAliases (aliases: Record<string, IMiddleware>) {
        this.middlewareAliases = aliases

        this.syncMiddlewareToRouter()

        return this
    }

    /**
     * Set the application's middleware priority.
     *
     * @param priority
     */
    public setMiddlewarePriority (priority: MiddlewareList) {
        this.middlewarePriority = priority

        this.syncMiddlewareToRouter()

        return this
    }

    /**
     * Get the Laravel application instance.
     */
    public getApplication () {
        return this.app
    }

    /**
     * Set the Laravel application instance.
     *
     * @param app
     */
    public setApplication (app: IApplication) {
        this.app = app

        return this
    }
}