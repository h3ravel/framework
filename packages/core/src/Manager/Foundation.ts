import { ExceptionHandler, Exceptions } from '@h3ravel/foundation'

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
}