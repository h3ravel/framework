import { getQuery, getRouterParams, parseCookies, type H3Event } from 'h3'
import { IApplication } from '@h3ravel/contracts'
import { SuspiciousOperationException } from '../Exceptions/SuspiciousOperationException'
import { InputBag } from '../Utilities/InputBag'
import { HeaderBag } from '../Utilities/HeaderBag'
import { ParamBag } from '../Utilities/ParamBag'
import { FileBag } from '../Utilities/FileBag'
import { ServerBag } from '../Utilities/ServerBag'
import { FormRequest } from '../FormRequest'
import { HeaderUtility } from './HeaderUtility'
import { IpUtils } from './IpUtils'
import { ConflictingHeadersException } from '../Exceptions/ConflictingHeadersException'
import { Str } from '@h3ravel/support'
import path from 'node:path'
import { IHttpContext, IUrl, ISessionManager, RequestMethod } from '@h3ravel/contracts'

export class HttpRequest {
    public static HEADER_FORWARDED = 0b000001 // When using RFC 7239
    public static HEADER_X_FORWARDED_FOR = 0b000010
    public static HEADER_X_FORWARDED_HOST = 0b000100
    public static HEADER_X_FORWARDED_PROTO = 0b001000
    public static HEADER_X_FORWARDED_PORT = 0b010000
    public static HEADER_X_FORWARDED_PREFIX = 0b100000

    public static HEADER_X_FORWARDED_AWS_ELB = 0b0011010 // AWS ELB doesn't send X-Forwarded-Host
    public static HEADER_X_FORWARDED_TRAEFIK = 0b0111110 // All "X-Forwarded-*" headers sent by Traefik reverse proxy

    public static METHOD_HEAD = 'HEAD'
    public static METHOD_GET = 'GET'
    public static METHOD_POST = 'POST'
    public static METHOD_PUT = 'PUT'
    public static METHOD_PATCH = 'PATCH'
    public static METHOD_DELETE = 'DELETE'
    public static METHOD_PURGE = 'PURGE'
    public static METHOD_OPTIONS = 'OPTIONS'
    public static METHOD_TRACE = 'TRACE'
    public static METHOD_CONNECT = 'CONNECT'

    /**
     * Names for headers that can be trusted when
     * using trusted proxies.
     *
     * The FORWARDED header is the standard as of rfc7239.
     *
     * The other headers are non-standard, but widely used
     * by popular reverse proxies (like Apache mod_proxy or Amazon EC2).
     */
    private TRUSTED_HEADERS = {
        [HttpRequest.HEADER_FORWARDED]: 'FORWARDED',
        [HttpRequest.HEADER_X_FORWARDED_FOR]: 'X_FORWARDED_FOR',
        [HttpRequest.HEADER_X_FORWARDED_HOST]: 'X_FORWARDED_HOST',
        [HttpRequest.HEADER_X_FORWARDED_PROTO]: 'X_FORWARDED_PROTO',
        [HttpRequest.HEADER_X_FORWARDED_PORT]: 'X_FORWARDED_PORT',
        [HttpRequest.HEADER_X_FORWARDED_PREFIX]: 'X_FORWARDED_PREFIX',
    }

    private FORWARDED_PARAMS = {
        [HttpRequest.HEADER_X_FORWARDED_FOR]: 'for',
        [HttpRequest.HEADER_X_FORWARDED_HOST]: 'host',
        [HttpRequest.HEADER_X_FORWARDED_PROTO]: 'proto',
        [HttpRequest.HEADER_X_FORWARDED_PORT]: 'host',
    }

    #uri!: IUrl

    /**
     * Parsed request body
     */
    body: unknown

    #method?: RequestMethod = undefined

    #isHostValid: boolean = true

    #isIisRewrite: boolean = false

    protected format?: string

    protected basePath?: string

    protected baseUrl?: string

    protected requestUri?: string

    protected pathInfo?: string

    protected formData!: FormRequest

    private preferredFormat?: string
    private isForwardedValid: boolean = true

    public static trustedHosts: string[] = []
    private static trustedHeaderSet: number = -1
    protected static trustedHostPatterns: RegExp[] = []

    /**
     * Gets route parameters.
     * @returns An object containing route parameters.
     */
    public params!: NonNullable<H3Event['context']['params']>

    /**
     * Request body parameters (POST).
     *
     * @see getPayload() for portability between content types
     */
    protected request!: InputBag

    /**
     * Uploaded files (FILES).
     */
    public files!: FileBag

    /**
     * Query string parameters (GET).
     */
    public query!: InputBag

    /**
     * Server and execution environment parameters
     */
    public server!: ServerBag

    /**
     * Cookies
     */
    public cookies!: InputBag

    /**
     * The current Http Context
     */
    context!: IHttpContext

    /**
     * The request attributes (parameters parsed from the PATH_INFO, ...).
     */
    public attributes!: ParamBag

    /**
     * Gets the request headers.
     * @returns An object containing request headers.
     */
    public headers!: HeaderBag

    protected content?: ReadableStream | string | false | null = undefined

    protected static formats?: Record<string, string[]> | undefined | null = undefined

    protected static trustedProxies: string[] = []

    protected static httpMethodParameterOverride: boolean = false

    protected sessionManager!: ISessionManager
    protected sessionManagerClass!: typeof ISessionManager

    /**
     * List of Acceptable Content Types
     */
    private acceptableContentTypes: string[] = []

    private trustedValuesCache: Record<string, string[]> = {}

    constructor(
        /**
         * The current H3 H3Event instance
         */
        protected readonly event: H3Event,
        /**
         * The current app instance
         */
        public app: IApplication
    ) { }

    /**
     * Sets the parameters for this request.
     *
     * This method also re-initializes all properties.
     *
     * @param attributes 
     * @param cookies    The COOKIE parameters
     * @param files      The FILES parameters
     * @param server     The SERVER parameters
     * @param content    The raw body data
     */
    public async initialize (): Promise<void> {
        this.buildRequirements()
        this.sessionManagerClass = (await import(('@h3ravel/session'))).SessionManager
    }

    protected buildRequirements () {
        this.params = getRouterParams(this.event)
        this.request = new InputBag(this.formData ? this.formData.input() : {}, this.event)
        this.query = new InputBag(getQuery(this.event), this.event)
        this.attributes = new ParamBag(getRouterParams(this.event), this.event)
        this.cookies = new InputBag(parseCookies(this.event), this.event)
        this.files = new FileBag(this.formData ? this.formData.files() : {}, this.event)
        this.server = new ServerBag(Object.fromEntries(this.event.req.headers.entries()), this.event)
        this.headers = new HeaderBag(this.server.getHeaders())
        this.acceptableContentTypes = []
        // this.languages = undefined
        // this.charsets = undefined
        // this.encodings = undefined
        this.pathInfo = undefined
        this.requestUri = undefined
        this.baseUrl = undefined
        this.basePath = undefined
        this.#method = undefined
        this.format = undefined
        // this.#uri = Url.of(getRequestURL(this.event).toString(), this.app)
    }

    /**
     * Gets a list of content types acceptable by the client browser in preferable order.
     * @returns {string[]}
     */
    public getAcceptableContentTypes (): string[] {
        if (this.acceptableContentTypes.length > 0) {
            return this.acceptableContentTypes
        }

        const accept = this.getHeader('accept')
        if (!accept) return []

        // Split and clean up Accept header values
        const types = accept
            .split(',')
            .map(type => type.trim())
            .map(type => type.split(';')[0]) // strip quality params (e.g. ;q=0.8)
            .filter(Boolean)

        return (this.acceptableContentTypes = types)
    }

    /**
     * Get a URI instance for the request.
     */
    public getUriInstance (): IUrl {
        return this.#uri
    }

    /**
     * Returns the requested URI (path and query string).
     *
     * @return {string} The raw URI (i.e. not URI decoded)
     */
    public getRequestUri (): string {
        return this.requestUri ??= this.prepareRequestUri()
    }

    /**
     * Gets the scheme and HTTP host.
     *
     * If the URL was called with basic authentication, the user
     * and the password are not added to the generated string.
     */
    public getSchemeAndHttpHost (): string {
        return this.getScheme() + '://' + this.getHttpHost()
    }

    /**
     * Returns the HTTP host being requested.
     *
     * The port name will be appended to the host if it's non-standard.
     */
    public getHttpHost (): string {
        const scheme = this.getScheme()
        const port = this.getPort()

        if (('http' === scheme && 80 == port) || ('https' === scheme && 443 == port)) {
            return this.getHost()
        }

        return this.getHost() + ':' + port
    }

    /**
     * Returns the root path from which this request is executed.
     *
     * @returns {string} The raw path (i.e. not urldecoded)
     */
    public getBasePath (): string {
        return this.basePath ??= this.prepareBasePath()
    }

    /**
     * Returns the root URL from which this request is executed.
     *
     * The base URL never ends with a /.
     *
     * This is similar to getBasePath(), except that it also includes the
     * script filename (e.g. index.php) if one exists.
     *
     * @return string The raw URL (i.e. not urldecoded)
     */
    public getBaseUrl (): string {
        let trustedPrefix = ''
        let trustedPrefixValues: string[]

        // the proxy prefix must be prepended to any prefix being needed at the webserver level
        if (this.isFromTrustedProxy() && (trustedPrefixValues = this.getTrustedValues(HttpRequest.HEADER_X_FORWARDED_PREFIX))) {
            trustedPrefix = Str.rtrim(trustedPrefixValues[0], '/')
        }

        return trustedPrefix + this.getBaseUrlReal()
    }

    /**
     * Returns the real base URL received by the webserver from which this request is executed.
     * The URL does not include trusted reverse proxy prefix.
     *
     * @return string The raw URL (i.e. not urldecoded)
     */
    private getBaseUrlReal (): string {
        return this.baseUrl ??= this.prepareBaseUrl()
    }

    /**
     * Gets the request's scheme.
     */
    public getScheme (): string {
        return this.isSecure() ? 'https' : 'http'
    }

    /**
     * Prepares the base URL.
     */
    protected prepareBaseUrl (): string {
        const requestUri = this.getRequestUri() ?? ''
        const scriptName = path.basename(__filename) // current script filename
        const baseUrl = '/' + scriptName

        // ensure requestUri starts with /
        const normalizedRequestUri = requestUri.startsWith('/') ? requestUri : '/' + requestUri

        // check if full baseUrl matches start of requestUri
        if (normalizedRequestUri.startsWith(baseUrl)) {
            return baseUrl
        }

        // fallback: use directory of script
        const dirBase = path.dirname(baseUrl)
        if (normalizedRequestUri.startsWith(dirBase)) {
            return dirBase.replace(/[/\\]+$/, '')
        }

        // nothing matches, return empty
        return ''
    }

    /**
     * Prepares the Request URI.
     */
    protected prepareRequestUri (): string {
        let requestUri = ''
        // console.log(this.server.all())
        // IIS-style URL rewrite could be behind a header like x-original-url
        const unencodedUrl = this.server.get('x-original-url') ?? ''
        if (this.isIisRewrite() && unencodedUrl) {
            requestUri = unencodedUrl
            this.server.remove('x-original-url')
        } else if (this.server.has('REQUEST_URI')) {
            requestUri = this.server.get('REQUEST_URI') ?? ''

            if (requestUri && requestUri[0] === '/') {
                // Remove fragment
                const hashPos = requestUri.indexOf('#')
                if (hashPos !== -1) {
                    requestUri = requestUri.substring(0, hashPos)
                }
            } else {
                // Could be full URL from proxy, parse path + query
                try {
                    const urlObj = new URL(requestUri)
                    requestUri = urlObj.pathname
                    if (urlObj.search) {
                        requestUri += urlObj.search
                    }
                } catch {
                    // fallback if invalid URL, keep as-is
                }
            }
        } else {
            // fallback: just use request path
            requestUri = this.getRequestUri() ?? '/'
        }

        // normalize the request URI for future use
        this.server.set('REQUEST_URI', requestUri)

        return requestUri
    }

    /**
     * Prepares the base path.
     */
    protected prepareBasePath (): string {
        const baseUrl = this.getBaseUrl()
        if (!baseUrl) {
            return ''
        }

        const scriptFilename = this.server.get('SCRIPT_FILENAME') ?? ''
        const filename = path.basename(scriptFilename)

        let basePath: string
        if (path.basename(baseUrl) === filename) {
            basePath = path.dirname(baseUrl)
        } else {
            basePath = baseUrl
        }

        // normalize Windows paths to forward slashes
        basePath = basePath.replace(/\\/g, '/')

        // remove trailing slash
        return basePath.replace(/\/+$/, '')
    }

    /**
     * Prepares the path info.
     */
    protected preparePathInfo (): string {
        let requestUri = this.getRequestUri()
        if (!requestUri) return '/'

        // Remove the query string
        const qPos = requestUri.indexOf('?')
        if (qPos !== -1) {
            requestUri = requestUri.substring(0, qPos)
        }

        // Ensure it starts with /
        if (requestUri && requestUri[0] !== '/') {
            requestUri = '/' + requestUri
        }

        const baseUrl = this.getBaseUrlReal()
        if (baseUrl == null) {
            return requestUri
        }

        // Remove the base URL prefix
        let pathInfo = requestUri.substring(baseUrl.length)

        // Ensure pathInfo starts with /
        if (!pathInfo || pathInfo[0] !== '/') {
            pathInfo = '/' + pathInfo
        }

        return pathInfo
    }


    /**
     * Returns the port on which the request is made.
     *
     * This method can read the client port from the "X-Forwarded-Port" header
     * when trusted proxies were set via "setTrustedProxies()".
     *
     * The "X-Forwarded-Port" header must contain the client port.
     *
     * @return int|string|null Can be a string if fetched from the server bag
     */
    public getPort (): number | string | undefined {
        let pos: number
        let host: string | string[] | undefined | null

        if (this.isFromTrustedProxy() && (host = this.getTrustedValues(HttpRequest.HEADER_X_FORWARDED_PORT))) {
            host = host[0]
        } else if (this.isFromTrustedProxy() && (host = this.getTrustedValues(HttpRequest.HEADER_X_FORWARDED_HOST))) {
            host = host[0]
        } else if (!(host = this.headers.get('HOST'))) {
            return this.server.get('SERVER_PORT')
        }

        if (host[0] === '[') {
            pos = host.lastIndexOf(':', host.lastIndexOf(']'))
        } else {
            pos = host.lastIndexOf(':')
        }

        if (pos !== -1) {
            const portStr = typeof host === 'string' ? host.substring(pos + 1) : host.at(0)?.substring(pos + 1)
            if (portStr) {
                return parseInt(portStr, 10)
            }
        }

        return 'https' === this.getScheme() ? 443 : 80
    }

    public getHost (): string {
        let host: string | undefined | null

        if (this.isFromTrustedProxy() && (host = this.getTrustedValues(HttpRequest.HEADER_X_FORWARDED_HOST)?.[0])) {
            // do nothing, host already assigned
        } else if (!(host = this.headers.get('HOST'))) {
            host = this.server.get('SERVER_NAME') ?? this.server.get('SERVER_ADDR') ?? process.env.SERVER_NAME ?? ''
        }

        /* trim and remove port number, lowercase */
        host = (host ?? '').trim().replace(/:\d+$/, '').toLowerCase()

        /* validate host */
        if (host && !HttpRequest.isHostValid(host)) {
            if (!this.#isHostValid) {
                return ''
            }
            this.#isHostValid = false
            throw new SuspiciousOperationException(`Invalid Host "${host}".`)
        }

        /* trusted host patterns */
        const ctor = this.constructor as typeof HttpRequest

        if (ctor.trustedHostPatterns.length > 0) {
            if (ctor.trustedHosts.includes(host)) {
                return host
            }

            for (const pattern of ctor.trustedHostPatterns) {
                if (pattern.test(host)) {
                    ctor.trustedHosts.push(host)
                    return host
                }
            }

            if (!this.#isHostValid) {
                return ''
            }

            this.#isHostValid = false
            throw new SuspiciousOperationException(`Untrusted Host "${host}".`)
        }

        return host
    }


    /**
     * Checks whether the request is secure or not.
     *
     * This method can read the client protocol from the "X-Forwarded-Proto" header
     * when trusted proxies were set via "setTrustedProxies()".
     *
     * The "X-Forwarded-Proto" header must contain the protocol: "https" or "http".
     */
    public isSecure (): boolean {
        const proto = this.getTrustedValues(HttpRequest.HEADER_X_FORWARDED_PROTO)

        if (this.isFromTrustedProxy() && proto) {
            return ['https', 'on', 'ssl', '1'].includes(proto[0]?.toLowerCase())
        }

        const https = this.server.get('HTTPS')

        return !!https && 'off' !== https.toLowerCase()
    }


    /**
     * Is this IIS with UrlRewriteModule?
     *
     * This method consumes, caches and removed the IIS_WasUrlRewritten env var,
     * so we don't inherit it to sub-requests.
     */
    private isIisRewrite (): boolean {
        try {
            if (1 === this.server.getInt('IIS_WasUrlRewritten')) {
                this.#isIisRewrite = true
                this.server.remove('IIS_WasUrlRewritten')
            }
        } catch { /** */ }

        return this.#isIisRewrite
    }


    /**
     * Returns the value of the requested header.
     */
    public getHeader (name: string): string | undefined | null {
        return this.headers.get<string>(name)
    }


    /**
     * Checks if the request method is of specified type.
     *
     * @param method Uppercase request method (GET, POST etc)
     */
    public isMethod (method: string): boolean {
        return this.getMethod() === method.toUpperCase()
    }

    /**
     * Checks whether or not the method is safe.
     *
     * @see https://tools.ietf.org/html/rfc7231#section-4.2.1
     */
    public isMethodSafe (): boolean {
        return ['GET', 'HEAD', 'OPTIONS', 'TRACE'].includes(this.getMethod())
    }

    /**
     * Checks whether or not the method is idempotent.
     */
    public isMethodIdempotent (): boolean {
        return ['HEAD', 'GET', 'PUT', 'DELETE', 'TRACE', 'OPTIONS', 'PURGE'].includes(this.getMethod())
    }

    /**
     * Checks whether the method is cacheable or not.
     *
     * @see https://tools.ietf.org/html/rfc7231#section-4.2.3
     */
    public isMethodCacheable (): boolean {
        return ['GET', 'HEAD'].includes(this.getMethod())
    }

    /**
     * Returns true if the request is an XMLHttpRequest (AJAX).
     */
    public isXmlHttpRequest (): boolean {
        return 'XMLHttpRequest' === this.getHeader('X-Requested-With')
    }

    /**
     * See https://url.spec.whatwg.org/.
     */
    private static isHostValid (host: string): boolean {
        /**
         * Validate IPv6: [::1] or similar
         */
        if (host[0] === '[') {
            const last = host[host.length - 1]
            if (last === ']') {
                const inside = host.substring(1, host.length - 1)
                return Str.validateIp(inside, 'ipv6')
            }
            return false
        }

        /**
         * Validate IPv4: ends with .123 or .123.
         */
        if (/\.[0-9]+\.?$/.test(host)) {
            return Str.validateIp(host, 'ipv4')
        }

        /**
         * fallback: remove valid chars and check if anything remains
         */
        return '' === host.replace(/[-a-zA-Z0-9_]+\.?/g, '')
    }

    /**
     * Initializes HTTP request formats.
     */
    protected static initializeFormats (): void {
        this.formats = {
            html: ['text/html', 'application/xhtml+xml'],
            txt: ['text/plain'],
            js: ['application/javascript', 'application/x-javascript', 'text/javascript'],
            css: ['text/css'],
            json: ['application/json', 'application/x-json'],
            jsonld: ['application/ld+json'],
            xml: ['text/xml', 'application/xml', 'application/x-xml'],
            rdf: ['application/rdf+xml'],
            atom: ['application/atom+xml'],
            rss: ['application/rss+xml'],
            form: ['application/x-www-form-urlencoded', 'multipart/form-data'],
        }
    }

    /**
     * Gets the request "intended" method.
     *
     * If the X-HTTP-Method-Override header is set, and if the method is a POST,
     * then it is used to determine the "real" intended HTTP method.
     *
     * The _method request parameter can also be used to determine the HTTP method,
     * but only if enableHttpMethodParameterOverride() has been called.
     *
     * The method is always an uppercased string.
     *
     * @see getRealMethod()
     */
    public getMethod (): RequestMethod {
        if (this.#method) {
            return this.#method
        }

        this.#method = this.getRealMethod()

        if ('POST' !== this.#method) {
            return this.#method
        }

        let method = this.event.req.headers.get('X-HTTP-METHOD-OVERRIDE') as RequestMethod
        if (!method && HttpRequest.httpMethodParameterOverride) {
            method = this.request.get('_method', this.query.get('_method', 'POST')) as RequestMethod
        }

        if (typeof method !== 'string') {
            return this.#method
        }

        method = method.toUpperCase() as RequestMethod

        if (['GET', 'HEAD', 'POST', 'PUT', 'DELETE', 'CONNECT', 'OPTIONS', 'PATCH', 'PURGE', 'TRACE'].includes(method)) {
            this.#method = method
            return this.#method
        }

        if (!/^[A-Z]+$/.test(method)) {
            throw new SuspiciousOperationException('Invalid HTTP method override.')
        }

        this.#method = method
        return this.#method
    }

    /**
     * Gets the preferred format for the response by inspecting, in the following order:
     *   * the request format set using setRequestFormat;
     *   * the values of the Accept HTTP header.
     *
     * Note that if you use this method, you should send the "Vary: Accept" header
     * in the response to prevent any issues with intermediary HTTP caches.
     */
    public getPreferredFormat (defaultValue: string = 'html'): string | undefined {
        const preferredFormat = this.getRequestFormat()
        if (!this.preferredFormat && !!preferredFormat) {
            this.preferredFormat = preferredFormat
        }

        if (this.preferredFormat ?? null) {
            return this.preferredFormat
        }

        for (const mimeType of this.getAcceptableContentTypes()) {
            this.preferredFormat = this.getFormat(mimeType)
            if (this.preferredFormat) {
                return this.preferredFormat
            }
        }

        return defaultValue
    }

    /**
     * Gets the format associated with the mime type.
     */
    public getFormat (mimeType: string): string | undefined {
        const pos = mimeType.indexOf(';')
        let canonicalMimeType: string | null = null

        if (mimeType && pos > -1) {
            canonicalMimeType = mimeType.slice(0, pos).trim()
        }

        if (!HttpRequest.formats) {
            HttpRequest.initializeFormats()
        }

        let exactFormat: string | null = null
        let canonicalFormat: string | null = null

        for (const [format, mimeTypes] of Object.entries(HttpRequest.formats ?? {})) {

            if (mimeTypes.includes(mimeType)) {
                exactFormat = format
            }
            if (null !== canonicalMimeType && mimeTypes.includes(canonicalMimeType)) {
                canonicalFormat = format
            }
        }

        if (exactFormat ?? canonicalFormat) {
            return exactFormat ?? canonicalFormat!
        }

        return undefined
    }

    /**
     * Gets the request format.
     *
     * Here is the process to determine the format:
     *
     *  * format defined by the user (with setRequestFormat())
     *  * _format request attribute
     *  * $default
     *
     * @see getPreferredFormat
     */
    public getRequestFormat (defaultValue: string = 'html'): string | undefined {
        this.format ??= this.attributes.get('_format')

        return this.format ?? defaultValue
    }

    /**
     * Sets the request format.
     */
    public setRequestFormat (format: string): void {
        this.format = format
    }

    /**
     * Gets the "real" request method.
     *
     * @see getMethod()
     */
    public getRealMethod (): RequestMethod {
        return this.event.req.method.toUpperCase() as RequestMethod
    }

    /**
     * Gets the mime type associated with the format.
     */
    public getMimeType (format: string): string | undefined {
        if (!HttpRequest.formats) {
            HttpRequest.initializeFormats()
        }

        return HttpRequest.formats?.[format] ? HttpRequest.formats[format][0] : undefined
    }

    /**
     * Gets the mime types associated with the format.
     */
    public static getMimeTypes (format: string): string[] {
        if (!HttpRequest.formats) {
            HttpRequest.initializeFormats()
        }

        return HttpRequest.formats?.[format] ?? []
    }

    /**
     * Gets the list of trusted proxies.
     */
    public static getTrustedProxies (): string[] {
        return this.trustedProxies
    }

    /**
     * Returns the request body content.
     *
     * @param asStream If true, returns a ReadableStream instead of the parsed string
     * @return {string | ReadableStream | Promise<string | ReadableStream>}
     */
    public getContent (asStream = false): string | ReadableStream {
        let content = this.body

        // Handle cases where body was manually set (like in tests)
        if (content !== undefined && content !== null) {
            if (asStream) {
                // If content is a ReadableStream, rewind-like behavior doesn’t apply directly.
                // Recreate a new stream from string content if needed.
                if (content instanceof ReadableStream) {
                    return content
                }

                const encoder = new TextEncoder()
                return new ReadableStream({
                    start (controller) {
                        controller.enqueue(encoder.encode(String(content)))
                        controller.close()
                    }
                })
            }

            if (typeof content === 'string') {
                return content
            }

        }

        // When content was never read — use native H3 methods
        if (asStream) {
            // H3 provides the raw stream at this.event.req.body supplied to this.content
            return this.content as ReadableStream
        }

        // Default: read as text
        content = this.content
        this.body = content
        return content as never
    }

    /**
     * Gets a "parameter" value from any bag.
     *
     * This method is mainly useful for libraries that want to provide some flexibility. If you don't need the
     * flexibility in controllers, it is better to explicitly get request parameters from the appropriate
     * public property instead (attributes, query, request).
     *
     * Order of precedence: PATH (routing placeholders or custom attributes), GET, POST
     *
     * @internal use explicit input sources instead
     */
    public get (key: string, defaultValue?: any): any {
        const result = this.attributes.get(key, this)

        if (this !== result) {
            return result
        }

        if (this.query.has(key)) {
            return this.query.all()[key]
        }

        if (this.request.has(key)) {
            return this.request.all()[key]
        }

        return defaultValue
    }

    /**
     * Indicates whether this request originated from a trusted proxy.
     *
     * This can be useful to determine whether or not to trust the
     * contents of a proxy-specific header.
     */
    public isFromTrustedProxy (): boolean {
        return !HttpRequest.trustedProxies?.length && IpUtils.checkIp(this.server.get('REMOTE_ADDR')!, HttpRequest.trustedProxies)
    }

    /**
     * This method is rather heavy because it splits and merges headers, and it's called by many other methods such as
     * getPort(), isSecure(), getHost(), getClientIps(), this.() etc. Thus, we try to cache the results for
     * best performance.
     */
    private getTrustedValues (type: number, ip?: string | null): string[] {
        const trustedHeaders = this.TRUSTED_HEADERS
        const trustedHeaderSet = HttpRequest.trustedHeaderSet

        const cacheKey =
            type + '\0' +
            ((trustedHeaderSet & type) ? this.headers.get(trustedHeaders[type]) ?? '' : '') +
            '\0' + (ip ?? '') + '\0' + (this.headers.get(trustedHeaders[HttpRequest.HEADER_FORWARDED]) ?? '')

        if (this.trustedValuesCache[cacheKey]) {
            return this.trustedValuesCache[cacheKey]
        }

        let clientValues: string[] = []
        let forwardedValues: string[] = []

        // Handle direct trusted header (e.g., X-Forwarded-For, X-Forwarded-Port)
        if ((trustedHeaderSet & type) && this.headers.has(trustedHeaders[type])) {
            const headerValue = this.headers.get(trustedHeaders[type])!
            for (const v of headerValue.split(',')) {
                const value = (type === HttpRequest.HEADER_X_FORWARDED_PORT ? '0.0.0.0:' : '') + v.trim()
                clientValues.push(value)
            }
        }

        // Handle Forwarded header (RFC 7239)
        if (
            (trustedHeaderSet & HttpRequest.HEADER_FORWARDED) &&
            this.FORWARDED_PARAMS[type] &&
            this.headers.has(trustedHeaders[HttpRequest.HEADER_FORWARDED])
        ) {
            const forwarded = this.headers.get(trustedHeaders[HttpRequest.HEADER_FORWARDED])!
            const parts = HeaderUtility.split(forwarded, ',;=')
            const param = this.FORWARDED_PARAMS[type]

            for (const subParts of parts) {
                const combined = HeaderUtility.combine(subParts as never)
                let v = combined[param]
                if (typeof v === 'boolean') {
                    v = '0'
                }
                if (v == null) continue

                if (type === HttpRequest.HEADER_X_FORWARDED_PORT) {
                    if (v.endsWith(']') || !(v = v.substring(v.lastIndexOf(':')))) {
                        v = this.isSecure() ? ':443' : ':80'
                    }
                    v = '0.0.0.0' + v
                }

                forwardedValues.push(v)
            }
        }

        // Filter by IP if needed
        if (ip != null) {
            clientValues = this.normalizeAndFilterClientIps(clientValues, ip)
            forwardedValues = this.normalizeAndFilterClientIps(forwardedValues, ip)
        }

        // Resolve which values to trust
        if (JSON.stringify(forwardedValues) === JSON.stringify(clientValues) || clientValues.length === 0) {
            this.trustedValuesCache[cacheKey] = forwardedValues
            return forwardedValues
        }

        if (forwardedValues.length === 0) {
            this.trustedValuesCache[cacheKey] = clientValues
            return clientValues
        }

        if (!this.isForwardedValid) {
            const fallback = ip != null ? ['0.0.0.0', ip] : []
            this.trustedValuesCache[cacheKey] = fallback
            return fallback
        }

        this.isForwardedValid = false

        throw new ConflictingHeadersException(
            `The request has both a trusted "${trustedHeaders[HttpRequest.HEADER_FORWARDED]}" header and a trusted "${trustedHeaders[type]}" header, conflicting with each other. ` +
            'You should either configure your proxy to remove one of them, or configure your project to distrust the offending one.'
        )
    }

    /**
     * 
     * @param clientIps 
     * @param ip 
     * @returns 
     */
    private normalizeAndFilterClientIps (clientIps: string[], ip: string): string[] {
        if (!clientIps || clientIps.length === 0) {
            return []
        }

        // Complete the IP chain with the IP the request actually came from
        clientIps = [...clientIps, ip]

        let firstTrustedIp: string | null = null

        for (let i = 0; i < clientIps.length; i++) {
            let clientIp = clientIps[i]

            if (clientIp.includes('.')) {
                // Strip :port from IPv4 addresses
                const colonIndex = clientIp.indexOf(':')
                if (colonIndex > -1) {
                    clientIp = clientIp.substring(0, colonIndex)
                    clientIps[i] = clientIp
                }
            } else if (clientIp.startsWith('[')) {
                // Strip brackets and :port from IPv6 addresses
                const endBracketIndex = clientIp.indexOf(']', 1)
                if (endBracketIndex > -1) {
                    clientIp = clientIp.substring(1, endBracketIndex)
                    clientIps[i] = clientIp
                }
            }

            // Validate IP format
            if (Str.validateIp(clientIp)) {
                clientIps.splice(i, 1)
                i--
                continue
            }

            // Check if IP is part of trusted proxies
            if (IpUtils.checkIp(clientIp, HttpRequest.trustedProxies)) {
                clientIps.splice(i, 1)
                i--
                firstTrustedIp ??= clientIp
            }
        }

        // Now the IP chain contains only untrusted proxies and the client IP
        return clientIps.length > 0 ? clientIps.reverse() : (firstTrustedIp ? [firstTrustedIp] : [])
    }

    /**
     * Sets a list of trusted host patterns.
     *
     * You should only list the hosts you manage using regexes.
     * 
     * @param hostPatterns 
     */
    public static setTrustedHosts (hostPatterns: string[]): void {
        /* Convert host patterns to case-insensitive regex */
        this.trustedHostPatterns = hostPatterns.map(
            (hostPattern) => new RegExp(hostPattern, 'i')
        )

        /**
         * reset trusted hosts when patterns change
         */
        this.trustedHosts = []
    }

    /**
     * Returns the path being requested relative to the executed script.
     *
     * The path info always starts with a /.
     *
     * @return {string} The raw path (i.e. not urldecoded)
     */
    public getPathInfo (): string {
        return this.pathInfo ??= this.preparePathInfo()
    }

    /**
     * Gets the list of trusted host patterns.
     */
    public static getTrustedHosts (): RegExp[] {
        return this.trustedHostPatterns
    }

    /**
     * Enables support for the _method request parameter to determine the intended HTTP method.
     *
     * Be warned that enabling this feature might lead to CSRF issues in your code.
     * Check that you are using CSRF tokens when required.
     * If the HTTP method parameter override is enabled, an html-form with method "POST" can be altered
     * and used to send a "PUT" or "DELETE" request via the _method request parameter.
     * If these methods are not protected against CSRF, this presents a possible vulnerability.
     *
     * The HTTP method can only be overridden when the real HTTP method is POST.
     */
    public static enableHttpMethodParameterOverride (): void {
        this.httpMethodParameterOverride = true
    }

    /**
     * Checks whether support for the _method request parameter is enabled.
     */
    public static getHttpMethodParameterOverride (): boolean {
        return this.httpMethodParameterOverride
    }
}
