import { hmac } from '@h3ravel/support'
import type { Application } from '@h3ravel/core'
import type { IRouter } from '@h3ravel/shared'

/**
 * URL builder class with fluent API and request-aware helpers
 */
export class Url {
    private readonly _scheme?: string
    private readonly _host?: string
    private readonly _port?: number
    private readonly _path: string
    private readonly _query: Record<string, unknown>
    private readonly _fragment?: string
    private readonly app?: Application

    private constructor(
        app?: Application,
        scheme?: string,
        host?: string,
        port?: number,
        path: string = '/',
        query: Record<string, unknown> = {},
        fragment?: string
    ) {
        this.app = app
        this._scheme = scheme
        this._host = host
        this._port = port
        this._path = path.startsWith('/') ? path : `/${path}`
        this._query = { ...query }
        this._fragment = fragment
    }

    /**
     * Create a URL from a full URL string
     */
    static of(url: string, app?: Application): Url {
        try {
            const parsed = new URL(url)
            const query: Record<string, unknown> = {}
            
            // Parse query parameters
            parsed.searchParams.forEach((value, key) => {
                query[key] = value
            })

            return new Url(
                app,
                parsed.protocol.replace(':', ''),
                parsed.hostname,
                parsed.port ? parseInt(parsed.port) : undefined,
                parsed.pathname || '/',
                query,
                parsed.hash ? parsed.hash.substring(1) : undefined
            )
        } catch (error) {
            throw new Error(`Invalid URL: ${url}`)
        }
    }

    /**
     * Create a URL from a path relative to the app URL
     */
    static to(path: string, app?: Application): Url {
        // Use (app as any)?.config to avoid TS error if config is not typed on Application
        const baseUrl =
            (app && (app as any).config && typeof (app as any).config.get === 'function'
                ? (app as any).config.get('app.url')
                : undefined) ||
            process.env.APP_URL ||
            'http://localhost:3000'
        const fullUrl = new URL(path, baseUrl).toString()
        return Url.of(fullUrl, app)
    }

    /**
     * Create a URL from a named route
     */
    // Route parameter map (declaration-mergeable by consumers)
    // eslint-disable-next-line @typescript-eslint/ban-types
    static route<TName extends string = string, TParams extends Record<string, string | number> = Record<string, string | number>>(name: TName, params: TParams = {} as TParams, app?: Application): Url {
        if (!app) {
            throw new Error('Application instance required for route generation')
        }

        // Use (app as any).make to avoid TS error if make is not typed on Application
        const router = (app as any).make?.('router')
        if (!router || typeof router.route !== 'function') {
            throw new Error('Router not available or does not support route generation')
        }
        if (typeof (router as any).route !== 'function') {
            throw new Error('Router does not support route generation')
        }

        const routeUrl = (router as any).route(name, params)
        if (!routeUrl) {
            throw new Error(`Route "${name}" not found`)
        }

        return Url.to(routeUrl, app)
    }

    /**
     * Create a signed URL from a named route
     */
    static signedRoute<TName extends string = string, TParams extends Record<string, string | number> = Record<string, string | number>>(name: TName, params: TParams = {} as TParams, app?: Application): Url {
        const url = Url.route<TName, TParams>(name, params, app)
        return url.withSignature(app)
    }

    /**
     * Create a temporary signed URL from a named route
     */
    static temporarySignedRoute<TName extends string = string, TParams extends Record<string, string | number> = Record<string, string | number>>(
        name: TName, 
        params: TParams = {} as TParams, 
        expiration: number,
        app?: Application
    ): Url {
        const url = Url.route<TName, TParams>(name, params, app)
        return url.withSignature(app, expiration)
    }

    /**
     * Create a URL from a controller action
     */
    static action<TParams extends Record<string, string | number> = Record<string, string | number>>(controller: string, app?: Application): Url {
        if (!app) throw new Error('Application instance required for action URL generation')
        const [controllerName, methodName = 'index'] = controller.split('@')
        const routesRaw = (app as any).make?.('app.routes') as unknown
        if (!Array.isArray(routesRaw)) {
            // Backward-compatible message expected by existing tests
            throw new Error('Action URL generation requires router integration - not yet implemented')
        }
        const routes = routesRaw as Array<{ path: string; signature?: [string, string?] }>
        if (routes.length < 1) throw new Error(`No routes available to resolve action: ${controller}`)
        const found = routes.find(r => (r.signature?.[0] === controllerName) && ((r.signature?.[1] || 'index') === methodName))
        if (!found) throw new Error(`No route found for ${controller}`)
        return Url.to(found.path, app)
    }

    /**
     * Set the scheme (protocol) of the URL
     */
    withScheme(scheme: string): Url {
        return new Url(
            this.app,
            scheme,
            this._host,
            this._port,
            this._path,
            this._query,
            this._fragment
        )
    }

    /**
     * Set the host of the URL
     */
    withHost(host: string): Url {
        return new Url(
            this.app,
            this._scheme,
            host,
            this._port,
            this._path,
            this._query,
            this._fragment
        )
    }

    /**
     * Set the port of the URL
     */
    withPort(port: number): Url {
        return new Url(
            this.app,
            this._scheme,
            this._host,
            port,
            this._path,
            this._query,
            this._fragment
        )
    }

    /**
     * Set the path of the URL
     */
    withPath(path: string): Url {
        return new Url(
            this.app,
            this._scheme,
            this._host,
            this._port,
            path,
            this._query,
            this._fragment
        )
    }

    /**
     * Set the query parameters of the URL
     */
    withQuery(query: Record<string, unknown>): Url {
        return new Url(
            this.app,
            this._scheme,
            this._host,
            this._port,
            this._path,
            { ...query },
            this._fragment
        )
    }

    /**
     * Merge additional query parameters
     */
    withQueryParams(params: Record<string, unknown>): Url {
        return new Url(
            this.app,
            this._scheme,
            this._host,
            this._port,
            this._path,
            { ...this._query, ...params },
            this._fragment
        )
    }

    /**
     * Set the fragment (hash) of the URL
     */
    withFragment(fragment: string): Url {
        return new Url(
            this.app,
            this._scheme,
            this._host,
            this._port,
            this._path,
            this._query,
            fragment
        )
    }

    /**
     * Add a signature to the URL for security
     */
    withSignature(app?: Application, expiration?: number): Url {
        const appInstance = app || this.app
        if (!appInstance) {
            throw new Error('Application instance required for URL signing')
        }

        // Attempt to get the key from the app instance config, fallback to env
        const key =
            (typeof (appInstance as any).config?.get === 'function'
                ? (appInstance as any).config.get('app.key')
                : undefined) ||
            process.env.APP_KEY

        if (!key) {
            throw new Error('APP_KEY or app.key not configured')
        }
        const url = this.toString()
        let queryParams: Record<string, unknown> = { ...this._query }
        
        if (expiration) {
            queryParams.expires = Math.floor(expiration / 1000)
        }

        // Create signature payload
        const payload = expiration 
            ? `${url}?expires=${queryParams.expires}`
            : url

        const signature = hmac(payload, key)
        queryParams.signature = signature

        return this.withQuery(queryParams)
    }

    /**
     * Verify if a URL signature is valid
     */
    hasValidSignature(app?: Application): boolean {
        const appInstance = app || this.app
        if (!appInstance) {
            return false
        }

        const signature = this._query.signature
        if (!signature) {
            return false
        }

        // Check expiration if present
        if (this._query.expires !== undefined && this._query.expires !== null) {
            const expiresStr = String(this._query.expires)
            const expirationTime = parseInt(expiresStr, 10) * 1000
            if (isNaN(expirationTime) || Date.now() > expirationTime) {
                return false
            }
        }

        // Recreate URL without signature for verification
        const queryWithoutSignature = { ...this._query }
        delete queryWithoutSignature.signature

        const urlWithoutSignature = new Url(
            this.app,
            this._scheme,
            this._host,
            this._port,
            this._path,
            queryWithoutSignature,
            this._fragment
        ).toString()

        const payload = this._query.expires 
            ? `${urlWithoutSignature}?expires=${this._query.expires}`
            : urlWithoutSignature

        // config may not be typed on Application, so use type assertion
        const key = (appInstance as { config?: { get: (key: string) => string } })?.config?.get('app.key') || 'default-key'
        const expectedSignature = hmac(payload, key)

        return signature === expectedSignature
    }

    /**
     * Convert the URL to its string representation
     */
    toString(): string {
        let url = ''

        // Add scheme and host
        if (this._scheme && this._host) {
            url += `${this._scheme}://${this._host}`
            
            // Add port if specified and not default
            if (this._port && 
                !((this._scheme === 'http' && this._port === 80) || 
                  (this._scheme === 'https' && this._port === 443))) {
                url += `:${this._port}`
            }
        }

        // Add path
        if (this._path) {
            if (!this._path.startsWith('/')) {
                url += '/'
            }
            url += this._path
        }

        // Add query parameters
        const queryEntries = Object.entries(this._query)
        if (queryEntries.length > 0) {
            const queryString = queryEntries
                .map(([key, value]) => {
                    if (Array.isArray(value)) {
                        return value.map(v => `${encodeURIComponent(key)}%5B%5D=${encodeURIComponent(v)}`).join('&')
                    }
                    return `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`
                })
                .join('&')
            url += `?${queryString}`
        }

        // Add fragment
        if (this._fragment) {
            url += `#${this._fragment}`
        }

        return url
    }

    /**
     * Get the scheme
     */
    getScheme(): string | undefined {
        return this._scheme
    }

    /**
     * Get the host
     */
    getHost(): string | undefined {
        return this._host
    }

    /**
     * Get the port
     */
    getPort(): number | undefined {
        return this._port
    }

    /**
     * Get the path
     */
    getPath(): string {
        return this._path
    }

    /**
     * Get the query parameters
     */
    getQuery(): Record<string, unknown> {
        return { ...this._query }
    }

    /**
     * Get the fragment
     */
    getFragment(): string | undefined {
        return this._fragment
    }
}
