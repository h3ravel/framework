import { Application } from '@h3ravel/core'
import { HelpersContract } from './Contracts/UrlContract'
import { RequestAwareHelpers } from './RequestAwareHelpers'
import { Url } from './Url'
import { ExtractControllerMethods } from '@h3ravel/shared'

/**
 * Global helper functions for URL manipulation
 */

/**
 * Create a URL from a path relative to the app URL
 */
export function to (
    path: string,
    app?: Application
): Url {
    return Url.to(path, app)
}

/**
 * Create a URL from a named route
 */
export function route<TName extends string, TParams extends Record<string, string> = Record<string, string>> (
    name: TName,
    params: TParams = {} as TParams,
    app?: Application
): Url {
    return Url.route<TName, TParams>(name, params, app)
}

/**
 * Create a signed URL from a named route
 */
export function signedRoute<TName extends string, TParams extends Record<string, string> = Record<string, string>> (
    name: TName,
    params: TParams = {} as TParams,
    app?: Application
): Url {
    return Url.signedRoute<TName, TParams>(name, params, app)
}

/**
 * Create a temporary signed URL from a named route
 */
export function temporarySignedRoute (
    name: string,
    params: Record<string, string> = {},
    expiration: number,
    app?: Application
): Url {
    return Url.temporarySignedRoute(name, params, expiration, app)
}

/**
 * Create a URL from a controller action
 */
export function action (
    controller: string,
    app?: Application
): Url {
    return Url.action(controller, app)
}

/**
 * Get request-aware URL helpers
 */
export function url (app?: Application): RequestAwareHelpers {
    if (!app) throw new Error('Application instance required for request-aware URL helpers')
    return new RequestAwareHelpers(app)
}

/**
 * Create URL helpers that are bound to an application instance
 */
export function createUrlHelpers (app: Application): HelpersContract {
    return {
        /**
         * Create a URL from a path relative to the app URL
         */
        to: (path: string) => Url.to(path, app),

        /**
         * Create a URL from a named route
         */
        route: (
            name: string,
            params: Record<string, any> = {}
        ) => Url.route(name, params, app).toString(),

        /**
         * Create a signed URL from a named route
         */
        signedRoute: (
            name: string,
            params: Record<string, any> = {}
        ) => Url.signedRoute(name, params, app),

        /**
         * Create a temporary signed URL from a named route
         */
        temporarySignedRoute: (
            name: string,
            params: Record<string, any> = {},
            expiration: number
        ) => Url.temporarySignedRoute(name, params, expiration, app),

        /**
         * Create a URL from a controller action
         */
        action: <C extends new (...args: any) => any> (
            controller: string | [C, methodName: ExtractControllerMethods<InstanceType<C>>],
            params?: Record<string, any>
        ) => Url.action(controller, params, app).toString(),

        /**
         * Get request-aware URL helpers
         */
        url: (path?: string) => {
            if (path) {
                return Url.to(path).toString() as never
            }
            return new RequestAwareHelpers(app) as never
        }
    }
}
