import { ExceptionHandler, Exceptions, Middleware, MiddlewareHandler } from '@h3ravel/foundation'

import { Application } from '..'

export class Foundation {
    constructor(private app: Application) { }

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
    public withMiddleware (using: (middleware: Middleware) => void) {
        // Register the middleware container/manager as a singleton
        this.app.bind(MiddlewareHandler, () => new MiddlewareHandler())

        // Default to no-op callback if none provided
        using ??= () => true

        // After resolution, pass an instance of Middleware into the user callback
        this.app.afterResolving(MiddlewareHandler, (handler) => {
            using(new Middleware(handler))
        })

        return this
    }
}