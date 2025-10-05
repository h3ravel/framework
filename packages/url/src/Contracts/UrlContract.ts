import { ExtractControllerMethods } from '@h3ravel/shared'
import { RequestAwareHelpers } from '../RequestAwareHelpers'
import { Url } from '../Url'

export type RouteParams<N = any> = Record<string, N>

/**
 * Contract for URL manipulation and generation
 */
export interface UrlContract {
    /**
     * Set the scheme (protocol) of the URL
     */
    withScheme (scheme: string): this

    /**
     * Set the host of the URL
     */
    withHost (host: string): this

    /**
     * Set the port of the URL
     */
    withPort (port: number): this

    /**
     * Set the path of the URL
     */
    withPath (path: string): this

    /**
     * Set the query parameters of the URL
     */
    withQuery (query: Record<string, any>): this

    /**
     * Set the fragment (hash) of the URL
     */
    withFragment (fragment: string): this

    /**
     * Convert the URL to its string representation
     */
    toString (): string
}

/**
 * Contract for request-aware URL helpers
 */
export interface RequestAwareUrlContract {
    /**
     * Get the current request URL
     */
    current (): string

    /**
     * Get the full current URL with query string
     */
    full (): string

    /**
     * Get the previous request URL
     */
    previous (): string

    /**
     * Get the previous request path (without query string)
     */
    previousPath (): string

    /**
     * Get the current query parameters
     */
    query (): Record<string, any>
}

/**
 * The Url Helper Contract
 */
export interface HelpersContract {
    /**
     * Create a URL from a path relative to the app URL
     */
    to: (path: string) => Url

    /**
     * Create a URL from a named route
     */
    route: (name: string, params?: Record<string, any>) => string

    /**
     * Create a signed URL from a named route
     * 
     * @param name 
     * @param params 
     * @returns 
     */
    signedRoute: (name: string, params?: Record<string, any>) => Url

    /**
     * Create a temporary signed URL from a named route
     * 
     * @param name 
     * @param params 
     * @param expiration 
     * @returns 
     */
    temporarySignedRoute: (name: string, params: Record<string, any> | undefined, expiration: number) => Url

    /**
     * Create a URL from a controller action
     */
    action: <C extends new (...args: any) => any>(
        controller: string | [C, methodName: ExtractControllerMethods<InstanceType<C>>],
        params?: Record<string, any>
    ) => string

    /**
     * Get request-aware URL helpers
     */
    url: {
        (): RequestAwareHelpers
        (path: string): string
    }
}
