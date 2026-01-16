import { CallableConstructor, GenericObject, IRequest, IRoute, IRouteCollection, IUrlGenerator, RouteParams, UrlRoutable } from '@h3ravel/contracts'
import { Obj, optional, tap } from '@h3ravel/support'

import { RouteNotFoundException } from '@h3ravel/foundation'
import { RouteUrlGenerator } from './RouteUrlGenerator'
import crypto from 'crypto'

export class UrlGenerator extends IUrlGenerator {
    private routes: IRouteCollection
    private request: IRequest

    protected assetRoot?: string
    protected forcedRoot?: string
    protected forceScheme?: string

    protected cachedRoot?: string
    protected cachedScheme?: string

    protected keyResolver?: () => string | string[]
    protected missingNamedRouteResolver?: CallableConstructor

    /**
     * The session resolver callable.
     */
    protected sessionResolver?: CallableConstructor

    /**
     * The route URL generator instance.
     */
    protected routeGenerator?: RouteUrlGenerator

    /**
     * The named parameter defaults.
     */
    public defaultParameters: GenericObject = {}

    /**
     * The callback to use to format hosts.
     */
    #formatHostUsing?: CallableConstructor

    /**
     * The callback to use to format paths.
     */
    #formatPathUsing?: CallableConstructor

    constructor(routes: IRouteCollection, request: IRequest, assetRoot?: string) {
        super()
        this.routes = routes
        this.request = request
        this.assetRoot = assetRoot
    }

    /**
     * Get the full URL for the current request,
     * including the query string.
     *
     * Example:
     *   https://example.com/users?page=2
     */
    full (): string {
        return this.request.fullUrl()
    }

    /**
     * Get the URL for the current request path
     * without modifying the query string.
     */
    current (): string {
        return this.to(this.request.getPathInfo())
    }

    /**
     * Get the URL for the previous request.
     *
     * Resolution order:
     * 1. HTTP Referer header
     * 2. Session-stored previous URL
     * 3. Fallback (if provided)
     * 4. Root "/"
     *
     * @param fallback Optional fallback path or URL
     */
    previous (fallback: string | false = false): string {
        const referrer = this.request.headers.get('referer')

        const url = referrer ? this.to(referrer) : this.getPreviousUrlFromSession()

        if (url) {
            return url
        } else if (fallback) {
            return this.to(fallback)
        }

        return this.to('/')
    }

    /**
     * Generate an absolute URL to the given path.
     *
     * - Accepts relative paths or full URLs
     * - Automatically prefixes scheme + host
     * - Encodes extra path parameters safely
     *
     * @param path Relative or absolute path
     * @param extra Additional path segments
     * @param secure Force HTTPS or HTTP
     */
    to (path: string, extra: (string | number)[] = [], secure: boolean | null = null): string {
        if (this.isValidUrl(path)) {
            return path
        }

        const tail = extra.map(v => encodeURIComponent(String(v))).join('/')
        const root = this.formatRoot(this.formatScheme(secure))
        const [cleanPath, query] = this.extractQueryString(path)

        return this.format(
            root,
            '/' + [cleanPath, tail].filter(Boolean).join('/')
        ) + query
    }

    /**
     * Generate a secure (HTTPS) absolute URL.
     * 
     * @param path 
     * @param parameters 
     * @returns 
     */
    secure (path: string, parameters: any[] = []) {
        return this.to(path, parameters, true)
    }

    /**
     * Generate a URL to a public asset.
     *
     * - Skips URL generation if path is already absolute
     * - Removes index.php from root if present
     *
     * @param path Asset path
     * @param secure Force HTTPS
     */
    asset (path: string, secure: boolean | null = null): string {
        if (this.isValidUrl(path)) {
            return path
        }

        const root = this.assetRoot ?? this.formatRoot(this.formatScheme(secure))
        return this.removeIndex(root).replace(/\/$/, '') + '/' + path.replace(/^\/+/, '')
    }
    /**
     * Generate a secure (HTTPS) asset URL.
     * 
     * @param path 
     * @returns 
     */
    secureAsset (path: string) {
        return this.asset(path, true)
    }

    /**
     * Resolve the URL scheme to use.
     *
     * Priority:
     * 1. Explicit `secure` flag
     * 2. Forced scheme
     * 3. Request scheme (cached)
     * 
     * @param secure 
     */
    formatScheme (secure: boolean | null = null): string {
        if (secure !== null) {
            return secure ? 'https://' : 'http://'
        }

        if (!this.cachedScheme) {
            this.cachedScheme = this.forceScheme ?? `${this.request.getScheme()}://`
        }

        return this.cachedScheme
    }
    /**
     * Format the base root URL.
     *
     * - Applies forced root if present
     * - Replaces scheme while preserving host
     * - Result is cached per request
     *
     * @param scheme URL scheme
     * @param root Optional custom root
     */
    formatRoot (scheme: string, root?: string): string {
        const base = root ?? this.forcedRoot ?? `${this.request.getScheme()}://${this.request.getHost()}`
        return base.replace(/^https?:\/\//, scheme)
    }

    /**
     * Create a signed route URL for a named route.
     * 
     * @param name 
     * @param parameters 
     * @param expiration 
     * @param absolute 
     * @returns 
     */
    signedRoute (
        name: string,
        parameters: Record<string, any> = {},
        expiration?: number,
        absolute = true
    ): string {
        if (!this.keyResolver) {
            throw new Error('No key resolver configured.')
        }

        if (expiration) {
            parameters.expires = expiration
        }

        const url = this.route(name, parameters, absolute)
        const resolvedKeys = this.keyResolver()
        const keys = Array.isArray(resolvedKeys) ? resolvedKeys : [resolvedKeys]

        const signature = crypto
            .createHmac('sha256', keys[0])
            .update(url)
            .digest('hex')

        return this.route(name, { ...parameters, signature }, absolute)
    }

    /**
     * Check if the given request has a valid signature for a relative URL.
     * 
     * @param request 
     * @returns 
     */
    hasValidSignature (request: IRequest): boolean {
        const signature = request.query('signature')
        if (!signature || !this.keyResolver) return false

        const original = request.url()
        const resolvedKeys = this.keyResolver()
        const keys = Array.isArray(resolvedKeys) ? resolvedKeys : [resolvedKeys]

        return keys.some(key =>
            crypto.timingSafeEqual(
                Buffer.from(signature),
                Buffer.from(
                    crypto.createHmac('sha256', key).update(original).digest('hex')
                )
            )
        )
    }

    /**
     * Get the URL to a named route.
     * 
     * @param name 
     * @param parameters 
     * @param absolute 
     * @returns 
     */
    route (name: string, parameters: RouteParams = {}, absolute = true): string {
        const route = this.routes.getByName(name)

        if (route != null) {
            return this.toRoute(route, parameters, absolute)
        }

        if (this.missingNamedRouteResolver) {
            const url = this.missingNamedRouteResolver(name, parameters, absolute)
            if (url != null) return url
        }

        throw new RouteNotFoundException(`Route [${name}] not defined.`)
    }

    /**
     * Get the URL for a given route instance.
     *
     * @param  route
     * @param  parameters
     * @param  absolute
     */
    toRoute (route: IRoute, parameters: RouteParams = {}, absolute: boolean = true) {
        return this.routeUrl().to(
            route,
            parameters,
            absolute
        )
    }

    /**
     * Combine root and path into a final URL.
     *
     * Allows optional host and path formatters
     * to modify the output dynamically.
     * 
     * @param root 
     * @param path 
     * @param route 
     * @returns 
     */
    format (root: string, path: string, route?: IRoute): string {
        let finalPath = '/' + path.replace(/^\/+/, '')

        if (this.#formatHostUsing) {
            root = this.#formatHostUsing(root, route)
        }

        if (this.#formatPathUsing) {
            finalPath = this.#formatPathUsing(finalPath, route)
        }

        return (root + finalPath).replace(/\/+$/, '')
    }

    /**
     * Format the array of URL parameters.
     *
     * @param  parameters
     */
    formatParameters (parameters: GenericObject<UrlRoutable> | RouteParams): GenericObject {
        parameters = Obj.wrap(parameters as never)

        for (const [key, parameter] of Object.entries(parameters)) {
            if (Obj.isAssoc(parameter) && typeof parameter.getRouteKey === 'function') {
                parameters[key] = parameter.getRouteKey()
            }
        }

        return parameters
    }

    protected extractQueryString (path: string): [string, string] {
        const i = path.indexOf('?')
        return i === -1 ? [path, ''] : [path.slice(0, i), path.slice(i)]
    }

    /**
     * @param  root
     */
    protected removeIndex (root: string): string {
        return root
    }

    /**
     * Determine whether a string is a valid URL.
     *
     * Supports:
     * - Absolute URLs
     * - Protocol-relative URLs
     * - Anchors and special schemes
     * 
     * @param path 
     * @returns 
     */
    isValidUrl (path: string): boolean {
        if (/^(#|\/\/|https?:\/\/|(mailto|tel|sms):)/.test(path)) {
            return true
        }

        try {
            new URL(path)
            return true
        } catch {
            return false
        }
    }

    /**
     * Get the Route URL generator instance.
     */
    protected routeUrl (): RouteUrlGenerator {
        if (!this.routeGenerator) {
            this.routeGenerator = new RouteUrlGenerator(this, this.request)
        }

        return this.routeGenerator
    }

    /**
     * Force HTTPS for all generated URLs.
     * 
     * @param force 
     */
    forceHttps (force = true) {
        if (force) this.forceScheme = 'https://'
    }

    /**
     * Set the origin (scheme + host) for generated URLs.
     * 
     * @param root 
     */
    useOrigin (root?: string) {
        this.forcedRoot = root?.replace(/\/$/, '')
        this.cachedRoot = undefined
    }

    useAssetOrigin (root?: string) {
        this.assetRoot = root?.replace(/\/$/, '')
    }

    setKeyResolver (resolver: () => string | string[]) {
        this.keyResolver = resolver
    }

    resolveMissingNamedRoutesUsing (resolver: CallableConstructor) {
        this.missingNamedRouteResolver = resolver
    }

    formatHostUsing (callback: CallableConstructor) {
        this.#formatHostUsing = callback
        return this
    }

    formatPathUsing (callback: CallableConstructor) {
        this.#formatPathUsing = callback
        return this
    }

    /**
     * Get the request instance.
     */
    getRequest (): IRequest {
        return this.request
    }

    /**
     * Set the current request instance.
     *
     * @param  request
     */
    setRequest (request: IRequest) {
        this.request = request

        this.cachedRoot = undefined
        this.cachedScheme = undefined

        tap(optional(this.routeGenerator).defaultParameters || [], (defaults) => {
            this.routeGenerator = undefined

            if (defaults) {
                this.defaults(defaults)
            }
        })
    }

    /**
     * Set the route collection.
     *
     * @param routes
     */
    setRoutes (routes: IRouteCollection) {
        this.routes = routes

        return this
    }

    /**
     * Get the route collection.
     */
    getRoutes (): IRouteCollection {
        return this.routes
    }

    /**
     * Get the session implementation from the resolver.
     */
    protected getSession () {
        if (this.sessionResolver) {
            return this.sessionResolver()
        }
    }

    /**
     * Set the session resolver for the generator.
     *
     * @param   sessionResolver
     */
    setSessionResolver (sessionResolver: CallableConstructor) {
        this.sessionResolver = sessionResolver

        return this
    }

    /**
     * Clone a new instance of the URL generator with a different encryption key resolver.
     *
     * @param  keyResolver
     */
    withKeyResolver (keyResolver: () => string | string[]) {
        return structuredClone(this).setKeyResolver(keyResolver)
    }

    /**
     * Set the default named parameters used by the URL generator.
     *
     * @param  array  $defaults
     * @return void
     */
    defaults (defaults: GenericObject) {
        this.defaultParameters = Object.assign({}, this.defaultParameters, defaults)
    }

    /**
     * Get the previous URL from the session if possible.
     */
    protected getPreviousUrlFromSession () {
        // TODO: Implement session features to get previous URL
        // return this.getSession()?.previousUrl()
        return ''
    }
}
