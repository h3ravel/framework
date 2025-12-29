import { ExceptionHandler, Exceptions, Kernel, Middleware, MiddlewareList } from '..'
import { IApplication, IKernel } from '@h3ravel/contracts'

export class AppBuilder {

    /**
     * The Folio / page middleware that have been defined by the user.
     */
    protected pageMiddleware: MiddlewareList[] = []

    constructor(private app: IApplication) { }

    /**
     * Register the base kernel classes for the application.
     */
    public withKernels () {
        this.app.singleton(IKernel, Kernel)

        // TODO: Register Console Kernel here too

        return this
    }

    /**
     * Register and wire up the application's exception handling layer.
     * 
     * @param using
     **/
    public withExceptions (using: (exceptions: Exceptions) => void) {
        // Register the ExceptionHandler as a singleton
        this.app.singleton(ExceptionHandler, () => new ExceptionHandler())

        // Default to a no-op callback if none provided
        using ??= () => true

        // Hook into the lifecycle to initialize Exceptions once the handler is resolved
        this.app.afterResolving(ExceptionHandler, (handler) => {
            using(new Exceptions(handler))
        })

        return this
    }

    /**
     * Register and wire up the application's middleware handling layer.
     * 
     * @param using
     **/
    public withMiddleware (callback?: (mw: Middleware) => void) {
        // After resolution, pass an instance of Middleware into the user callback
        this.app.afterResolving(IKernel, (kernel) => {
            const middleware = new Middleware(this.app)
                .redirectGuestsTo(() => route('login'))

            if (callback && typeof callback === 'function') {
                callback(middleware)
            }

            this.pageMiddleware = middleware.getPageMiddleware()
            kernel.setGlobalMiddleware(middleware.getGlobalMiddleware())
            kernel.setMiddlewareGroups(middleware.getMiddlewareGroups())
            kernel.setMiddlewareAliases(middleware.getMiddlewareAliases())

            const priorities = middleware.getMiddlewarePriority()
            if (priorities) {
                kernel.setMiddlewarePriority(priorities)
            }

            // const priorityAppends = middleware.getMiddlewarePriorityAppends()
            // if (priorityAppends) {
            //     for (const [newMiddleware, after] of Object.entries(priorityAppends)) {
            //         kernel.addToMiddlewarePriorityAfter(after, newMiddleware)
            //     }
            // }

            // const priorityPrepends = middleware.getMiddlewarePriorityPrepends()
            // if (priorityPrepends) {
            //     for (const [newMiddleware, before] of Object.entries(priorityAppends)) {
            //         kernel.addToMiddlewarePriorityBefore(before, newMiddleware)
            //     }
            // }
        })

        return this
    }

    /**
     * create
     */
    public create () {

    }
}