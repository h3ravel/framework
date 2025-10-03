// Intentionally avoid importing Application type here to prevent TS rootDir issues
import { Url } from './Url'
import { RequestAwareHelpers } from './RequestAwareHelpers'

/**
 * Global helper functions for URL manipulation
 */

/**
 * Create a URL from a path relative to the app URL
 */
export function to(path: string, app?: any): Url {
    return Url.to(path, app)
}

/**
 * Create a URL from a named route
 */
export function route<TName extends string, TParams extends Record<string, string | number> = Record<string, string | number>>(name: TName, params: TParams = {} as TParams, app?: any): Url {
    return Url.route<TName, TParams>(name, params, app)
}

/**
 * Create a signed URL from a named route
 */
export function signedRoute<TName extends string, TParams extends Record<string, string | number> = Record<string, string | number>>(name: TName, params: TParams = {} as TParams, app?: any): Url {
    return Url.signedRoute<TName, TParams>(name, params, app)
}

/**
 * Create a temporary signed URL from a named route
 */
export function temporarySignedRoute(
    name: string, 
    params: Record<string, string | number> = {}, 
    expiration: number,
    app?: any
): Url {
    return Url.temporarySignedRoute(name, params, expiration, app)
}

/**
 * Create a URL from a controller action
 */
export function action<TParams extends Record<string, string | number> = Record<string, string | number>>(controller: string, app?: any): Url {
    return Url.action<TParams>(controller, app)
}

/**
 * Get request-aware URL helpers
 */
export function url(app?: any): RequestAwareHelpers {
    if (!app) throw new Error('Application instance required for request-aware URL helpers')
    return new RequestAwareHelpers(app)
}

/**
 * Create URL helpers that are bound to an application instance
 */
export function createUrlHelpers(app: any) {
    return {
        /**
         * Create a URL from a path relative to the app URL
         */
        to: (path: string) => Url.to(path, app),

        /**
         * Create a URL from a named route
         */
        route: (name: string, params: Record<string, any> = {}) => Url.route(name, params, app),

        /**
         * Create a signed URL from a named route
         */
        signedRoute: (name: string, params: Record<string, any> = {}) => Url.signedRoute(name, params, app),

        /**
         * Create a temporary signed URL from a named route
         */
        temporarySignedRoute: (name: string, params: Record<string, any> = {}, expiration: number) => 
            Url.temporarySignedRoute(name, params, expiration, app),

        /**
         * Create a URL from a controller action
         */
        action: (controller: string) => Url.action(controller, app),

        /**
         * Get request-aware URL helpers
         */
        url: () => new RequestAwareHelpers(app)
    }
}
