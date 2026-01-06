import { IMiddleware, RouteMethod } from '@h3ravel/contracts'

export class FiltersControllerMiddleware {
    /**
     * Determine if the given options exclude a particular method.
     *
     * @param  method
     * @param  options
     */
    static methodExcludedByOptions (method: RouteMethod, options: IMiddleware['options']) {
        return (typeof options.only !== 'undefined' && !options.only.includes(method)) ||
            (!!options.except && options.except.length > 0 && options.except.includes(method))
    }
}
