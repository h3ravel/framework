import { CacheOptions, IHttpResponse, IRequest, ResponseObject } from '@h3ravel/contracts'
import { DateTime, InvalidArgumentException } from '@h3ravel/support'
import { HTTP_RESPONSE_CACHE_CONTROL_DIRECTIVES, statusTexts } from '@h3ravel/foundation'

import { Cookie } from './Cookie'
import type { H3Event } from 'h3'
import { HeaderBag } from '../Utilities/HeaderBag'
import { HttpResponseException } from '../Exceptions/HttpResponseException'
import { ResponseHeaderBag } from '../Utilities/ResponseHeaderBag'

export class HttpResponse extends IHttpResponse {
    protected statusCode: number = 200
    protected headers: ResponseHeaderBag
    protected content!: any
    protected version!: string
    protected statusText!: string
    protected charset?: string

    /**
     * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Cache-Control
     */
    private HTTP_RESPONSE_CACHE_CONTROL_DIRECTIVES = HTTP_RESPONSE_CACHE_CONTROL_DIRECTIVES

    /**
     * The exception that triggered the error response (if applicable).
     */
    public exception?: Error

    /**
     * Tracks headers already sent in informational responses.
     */
    private sentHeaders: Record<string, string[]> = {}

    /**
     * Status codes translation table.
     *
     * The list of codes is complete according to the
     * @link https://www.iana.org/assignments/http-status-codes/http-status-codes.xhtml Hypertext Transfer Protocol (HTTP) Status Code Registry
     * (last updated 2021-10-01).
     *
     * Unless otherwise noted, the status code is defined in RFC2616.
     */
    public static statusTexts = statusTexts

    constructor(
        /**
         * The current H3 H3Event instance
         */
        protected readonly event: H3Event,
    ) {
        super()
        this.headers = new ResponseHeaderBag(this.event)
        this.setContent()
        this.setProtocolVersion('1.0')
    }

    /**
     * Set HTTP status code.
     */
    public setStatusCode (code: number, text?: string): this {
        this.statusCode = code
        this.event.res.status = code

        if (this.isInvalid()) {
            throw new InvalidArgumentException(`The HTTP status code "${code}" is not valid.`)
        }

        if (!text) {
            this.statusText = HttpResponse.statusTexts[code] ?? 'unknown status'
            this.event.res.statusText = this.statusText

            return this
        }

        this.statusText = text
        this.event.res.statusText = this.statusText
        return this
    }

    /**
     * Retrieves the status code for the current web response.
     */
    public getStatusCode (): number {
        return this.statusCode
    }

    /**
     * Sets the response charset.
     */
    public setCharset (charset: string): this {
        this.charset = charset

        return this
    }

    /**
     * Retrieves the response charset.
     */
    public getCharset (): string | undefined {
        return this.charset
    }

    /**
     * Returns true if the response may safely be kept in a shared (surrogate) cache.
     *
     * Responses marked "private" with an explicit Cache-Control directive are
     * considered uncacheable.
     *
     * Responses with neither a freshness lifetime (Expires, max-age) nor cache
     * validator (Last-Modified, ETag) are considered uncacheable because there is
     * no way to tell when or how to remove them from the cache.
     *
     * Note that RFC 7231 and RFC 7234 possibly allow for a more permissive implementation,
     * for example "status codes that are defined as cacheable by default [...]
     * can be reused by a cache with heuristic expiration unless otherwise indicated"
     * (https://tools.ietf.org/html/rfc7231#section-6.1)
     *
     * @final
     */
    public isCacheable (): boolean {
        if (![200, 203, 300, 301, 302, 404, 410].includes(this.statusCode)) {
            return false
        }

        if (this.headers.hasCacheControlDirective('no-store') || this.headers.getCacheControlDirective('private')) {
            return false
        }

        return this.isValidateable() || this.isFresh()
    }

    /**
     * Returns true if the response is "fresh".
     *
     * Fresh responses may be served from cache without any interaction with the
     * origin. A response is considered fresh when it includes a Cache-Control/max-age
     * indicator or Expires header and the calculated age is less than the freshness lifetime.
     */
    public isFresh (): boolean {
        return Number(this.getTtl()) > 0
    }

    /**
     * Returns true if the response includes headers that can be used to validate
     * the response with the origin server using a conditional GET request.
     */
    public isValidateable (): boolean {
        return this.headers.has('Last-Modified') || this.headers.has('ETag')
    }


    /**
     * Sets the response content.
     */
    public setContent (content?: any): this {
        this.content = content ?? ''

        return this
    }

    /**
     * Gets the current response content.
     */
    public getContent (): any {
        return this.content
    }

    /**
     * Set a header.
     */
    public setHeader (name: string, value: string): this {
        this.headers.set(name, value)
        return this
    }

    /**
     * Sets the HTTP protocol version (1.0 or 1.1).
     */
    public setProtocolVersion (version: string): this {
        this.version = version

        return this
    }

    /**
     * Gets the HTTP protocol version.
     */
    public getProtocolVersion (): string {
        return this.version
    }

    /**
     * Marks the response as "private".
     *
     * It makes the response ineligible for serving other clients.
     */
    public setPrivate (): this {
        this.headers.removeCacheControlDirective('public')
        this.headers.addCacheControlDirective('private')

        return this
    }

    /**
     * Marks the response as "public".
     *
     * It makes the response eligible for serving other clients.
     */
    public setPublic (): this {
        this.headers.addCacheControlDirective('public')
        this.headers.removeCacheControlDirective('private')

        return this
    }

    /**
     * Returns the Date header as a DateTime instance.
     * @throws {RuntimeException} When the header is not parseable
     */
    public getDate (): DateTime | undefined {
        return this.headers.getDate('Date')
    }

    /**
     * Returns the age of the response in seconds.
     *
     * @final
     */
    public getAge (): number {
        const age = this.headers.get('Age')

        if (age) {
            return Number(age)
        }

        return Math.max(DateTime.now().unix() - this.getDate()!.unix(), 0)
    }

    /**
     * Marks the response stale by setting the Age header to be equal to the maximum age of the response.
     */
    public expire (): this {
        if (this.isFresh()) {
            this.headers.set('Age', String(this.getMaxAge()))
            this.headers.remove('Expires')
        }

        return this
    }

    /**
     * Returns the value of the Expires header as a DateTime instance.
     *
     * @final
     */
    public getExpires (): DateTime | undefined {
        try {
            return new DateTime(this.headers.getDate('Expires'))
        } catch {
            // according to RFC 2616 invalid date formats (e.g. "0" and "-1") must be treated as in the past
            return new DateTime(DateTime.now().subtract(2, 'days'))
        }
    }

    /**
     * Returns the number of seconds after the time specified in the response's Date
     * header when the response should no longer be considered fresh.
     *
     * First, it checks for a s-maxage directive, then a max-age directive, and then it falls
     * back on an expires header. It returns null when no maximum age can be established. 
     */
    public getMaxAge (): number | undefined {
        if (this.headers.hasCacheControlDirective('s-maxage')) {
            return Number(this.headers.getCacheControlDirective('s-maxage'))
        }

        if (this.headers.hasCacheControlDirective('max-age')) {
            return Number(this.headers.getCacheControlDirective('max-age'))
        }

        const expires = this.getExpires()

        if (expires) {
            const maxAge = Number(expires!.unix() - this.getDate()!.unix())

            return Math.max(maxAge, 0)
        }

        return
    }

    /**
     * Sets the number of seconds after which the response should no longer be considered fresh.
     *
     * This method sets the Cache-Control max-age directive.
     */
    public setMaxAge (value: number): this {
        this.headers.addCacheControlDirective('max-age', String(value))

        return this
    }

    /**
     * Sets the number of seconds after which the response should no longer be returned by shared caches when backend is down.
     *
     * This method sets the Cache-Control stale-if-error directive.
     */
    public setStaleIfError (value: number): this {
        this.headers.addCacheControlDirective('stale-if-error', String(value))

        return this
    }

    /**
     * Sets the number of seconds after which the response should no longer return stale content by shared caches.
     *
     * This method sets the Cache-Control stale-while-revalidate directive.
     */
    public setStaleWhileRevalidate (value: number): this {
        this.headers.addCacheControlDirective('stale-while-revalidate', String(value))

        return this
    }

    /**
     * Returns the response's time-to-live in seconds.
     *
     * It returns null when no freshness information is present in the response.
     *
     * When the response's TTL is 0, the response may not be served from cache without first
     * revalidating with the origin.
     *
     * @final
     */
    public getTtl (): number | undefined {
        const maxAge = Number(this.getMaxAge())

        return null !== maxAge ? Math.max(maxAge - this.getAge(), 0) : undefined
    }

    /**
     * Sets the response's time-to-live for shared caches in seconds.
     *
     * This method adjusts the Cache-Control/s-maxage directive.
     */
    public setTtl (seconds: number): this {
        this.setSharedMaxAge(this.getAge() + seconds)

        return this
    }

    /**
     * Sets the response's time-to-live for private/client caches in seconds.
     *
     * This method adjusts the Cache-Control/max-age directive.
     */
    public setClientTtl (seconds: number): this {
        this.setMaxAge(this.getAge() + seconds)

        return this
    }

    /**
     * Sets the number of seconds after which the response should no longer be considered fresh by shared caches.
     *
     * This method sets the Cache-Control s-maxage directive.
     */
    public setSharedMaxAge (value: number): this {
        this.setPublic()
        this.headers.addCacheControlDirective('s-maxage', String(value))

        return this
    }

    /**
     * Returns the Last-Modified HTTP header as a DateTime instance.
     *
     * @throws \RuntimeException When the HTTP header is not parseable
     *
     * @final
     */
    public getLastModified (): DateTime | undefined {
        return this.headers.getDate('Last-Modified')
    }

    /**
     * Sets the Last-Modified HTTP header with a DateTime instance.
     *
     * Passing null as value will remove the header.
     *
     * @return $this
     *
     * @final
     */
    public setLastModified (date?: DateTime | Date | string): this {
        if (!date) {
            this.headers.remove('Last-Modified')

            return this
        }

        date = new DateTime(date).setTimezone('UTC')
        this.headers.set('Last-Modified', date.format('ddd, DD MMM YYYY HH:mm:ss') + ' GMT')

        return this
    }

    /**
     * Returns the literal value of the ETag HTTP header.
     */
    public getEtag (): string | null {
        return this.headers.get('ETag')
    }

    /**
     * Sets the ETag value.
     *
     * @param etag The ETag unique identifier or null to remove the header
     * @param weak Whether you want a weak ETag or not
     */
    public setEtag (etag?: string, weak: boolean = false): this {
        if (!etag) {
            this.headers.remove('Etag')
        } else {

            if (!etag.startsWith('"')) {
                etag = '"' + etag + '"'
            }

            this.headers.set('ETag', (true === weak ? 'W/' : '') + etag)
        }

        return this
    }

    /**
     * Sets the response's cache headers (validation and/or expiration).
     *
     * Available options are: must_revalidate, no_cache, no_store, no_transform, public, private, proxy_revalidate, max_age, s_maxage, immutable, last_modified and etag.
     *
     * @throws {InvalidArgumentException}
     */
    public setCache (options: CacheOptions): this {
        const invalidKeys = Object.keys(options).filter(
            key => !(key in HTTP_RESPONSE_CACHE_CONTROL_DIRECTIVES)
        )

        if (invalidKeys.length > 0) {
            throw new InvalidArgumentException(
                `Response does not support the following options: "${invalidKeys.join('", "')}"`
            )
        }

        // Validation headers
        if (options.etag) this.setEtag(options.etag)
        if (options.last_modified) this.setLastModified(options.last_modified)

        // Expiration headers
        if (options.max_age) this.setMaxAge(options.max_age)
        if (options.s_maxage) this.setSharedMaxAge(options.s_maxage)
        if (options.stale_while_revalidate)
            this.setStaleWhileRevalidate(options.stale_while_revalidate)
        if (options.stale_if_error)
            this.setStaleIfError(options.stale_if_error)

        // Cache-Control flags
        for (const [directive, hasValue] of Object.entries(
            HTTP_RESPONSE_CACHE_CONTROL_DIRECTIVES
        )) {
            if (!hasValue && directive in options) {
                const token = directive.replace(/_/g, '-')
                if (options[directive as keyof CacheOptions]) {
                    this.headers.addCacheControlDirective(token)
                } else {
                    this.headers.removeCacheControlDirective(token)
                }
            }
        }

        // Public/private overrides
        if (options.public !== undefined) {
            if (options.public) this.setPublic()
            else this.setPrivate()
        }

        if (options.private !== undefined) {
            if (options.private) this.setPrivate()
            else this.setPublic()
        }

        return this
    }

    /**
     * Modifies the response so that it conforms to the rules defined for a 304 status code.
     *
     * This sets the status, removes the body, and discards any headers
     * that MUST NOT be included in 304 responses.
     * @see https://tools.ietf.org/html/rfc2616#section-10.3.5
     */
    public setNotModified (): this {
        this.setStatusCode(304)
        this.setContent()

        // remove headers that MUST NOT be included with 304 Not Modified responses
        for (const header of [
            'Allow', 'Content-Encoding', 'Content-Language', 'Content-Length', 'Content-MD5', 'Content-Type', 'Last-Modified'
        ]) {
            this.headers.remove(header)

        }

        return this
    }

    /**
     * Add an array of headers to the response.
     *
     */
    public withHeaders (headers: HeaderBag | ResponseObject) {
        if (headers instanceof HeaderBag) {
            headers = headers.all()
        }

        for (const [key, value] of Object.entries(headers)) {
            this.headers.set(key, value)
        }

        return this
    }

    /**
     * Set the exception to attach to the response.
     */
    public withException (e: Error) {
        this.exception = e

        return this
    }

    /**
     * Throws the response in a HttpResponseException instance.
     *
     * @throws {HttpResponseException}
     */
    public throwResponse () {
        throw new HttpResponseException(this)
    }

    /**
     * Is response invalid?
     *
     * @see https://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html
     */
    public isInvalid (): boolean {
        return this.statusCode < 100 || this.statusCode >= 600
    }

    /**
     * Is response informative?
     */
    public isInformational (): boolean {
        return this.statusCode >= 100 && this.statusCode < 200
    }

    /**
     * Is response successful?
     */
    public isSuccessful (): boolean {
        return this.statusCode >= 200 && this.statusCode < 300
    }

    /**
     * Is the response a redirect?
     */
    public isRedirection (): boolean {
        return this.statusCode >= 300 && this.statusCode < 400
    }

    /**
     * Is there a client error?
     */
    public isClientError (): boolean {
        return this.statusCode >= 400 && this.statusCode < 500
    }

    /**
     * Was there a server side error?
     */
    public isServerError (): boolean {
        return this.statusCode >= 500 && this.statusCode < 600
    }

    /**
     * Is the response OK?
     */
    public isOk (): boolean {
        return 200 === this.statusCode
    }

    /**
     * Is the response forbidden?
     */
    public isForbidden (): boolean {
        return 403 === this.statusCode
    }

    /**
     * Is the response a not found error?
     */
    public isNotFound (): boolean {
        return 404 === this.statusCode
    }

    /**
     * Is the response a redirect of some form?
     */
    public isRedirect (location?: string | null): boolean {
        if (![201, 301, 302, 303, 307, 308].includes(this.statusCode)) return false

        // If no location is passed, only check the status code.
        if (!location) return true

        // Compare given location with the Location header.
        return location === this.headers.get('Location')
    }

    /**
     * Is the response empty?
     */
    public isEmpty (): boolean {
        return [204, 304].includes(this.statusCode)
    }

    /**
     * Apply headers before sending response.
     */
    public sendHeaders (statusCode?: number): this {
        statusCode ??= this.statusCode

        const informational = statusCode >= 100 && statusCode < 200

        // Loop through headers
        for (const [name, values] of Object.entries(this.headers.allPreserveCaseWithoutCookies())) {
            const previousValues = this.sentHeaders[name] ?? null
            if (previousValues && JSON.stringify(previousValues) === JSON.stringify(values)) {
                // Already sent
                continue
            }

            const replace = name.localeCompare('Content-Type', undefined, { sensitivity: 'accent' }) === 0

            // If headers changed, clear old ones
            if (previousValues && previousValues.some(v => !values.includes(v))) {
                this.event.res.headers.delete(name)
            }

            const newValues = !previousValues
                ? values
                : values.filter(v => !previousValues.includes(v))

            for (const value of newValues) {
                if (replace) this.event.res.headers.set(name, value)
                else this.event.res.headers.append(name, value)
            }

            if (informational) {
                this.sentHeaders[name] = values
            }
        }

        // Cookies
        for (const cookie of this.headers.getCookies() as Cookie[]) {
            this.event.res.headers.append('Set-Cookie', cookie.toString())
        }

        // Informational responses (flush headers only)
        if (informational) {
            return this
        }

        // Final status line
        this.setStatusCode(statusCode, this.statusText)

        return this
    }
    /**
     * Prepares the Response before it is sent to the client. 
     * 
     * This method tweaks the Response to ensure that it is 
     * compliant with RFC 2616. Most of the changes are based on 
     * the Request that is "associated" with this Response.
     **/
    public prepare (request: IRequest): this {
        const isInformational = this.isInformational()
        const isEmpty = this.isEmpty()

        // 1. Handle informational or empty responses
        if (isInformational || isEmpty) {
            this.setContent()
            this.headers.remove('Content-Type')
            this.headers.remove('Content-Length')
            return this
        }

        // 2. Content-Type based on Request
        if (!this.headers.has('Content-Type')) {
            const format = request.getRequestFormat()
            if (format) {
                const mimeType = request.getMimeType(format)
                if (mimeType) {
                    this.headers.set('Content-Type', mimeType)
                }
            }
        }

        // 3. Fix Content-Type and Charset
        const charset = this.charset || 'UTF-8'
        this.charset ??= charset

        const currentType = this.headers.get('Content-Type') || ''

        if (!this.headers.has('Content-Type')) {
            this.headers.set('Content-Type', `text/html; charset=${charset}`)
        } else if (
            currentType.toLowerCase().startsWith('text/') &&
            !/charset=/i.test(currentType)
        ) {
            this.headers.set('Content-Type', `${currentType}; charset=${charset}`)
        }

        // 4. Fix Content-Length if Transfer-Encoding exists
        if (this.headers.has('Transfer-Encoding')) {
            this.headers.remove('Content-Length')
        }

        // 5. Handle HEAD requests
        if (request.isMethod('HEAD')) {
            const length = this.headers.get('Content-Length')
            this.setContent(undefined)
            if (length) this.headers.set('Content-Length', length)
        }

        // 6. Fix protocol
        const protocol = request._server?.get('SERVER_PROTOCOL') || 'HTTP/1.1'
        if (protocol !== 'HTTP/1.0') {
            this.setProtocolVersion('1.1')
        }

        // 7. Handle HTTP/1.0 Cache-Control headers
        if (
            this.getProtocolVersion() === '1.0' &&
            (this.headers.get('Cache-Control') || '').includes('no-cache')
        ) {
            this.headers.set('pragma', 'no-cache')
            this.headers.set('expires', '-1')
        }

        // 8. IE over SSL compatibility fix (if applicable)
        this.ensureIEOverSSLCompatibility(request)

        // 9. Secure cookies
        if (request.isSecure()) {
            for (const cookie of this.headers.getCookies() as Cookie[]) {
                cookie.setSecureDefault(true)
            }
        }

        return this
    }

    /**
     * Checks if we need to remove Cache-Control for SSL encrypted downloads when using IE < 9.
     *
     * @see http://support.microsoft.com/kb/323308
     */
    protected ensureIEOverSSLCompatibility (request: IRequest) {
        const contentDisposition = this.headers.get('Content-Disposition') || ''
        const userAgent = request.headers.get('user-agent') || ''

        if (
            contentDisposition.toLowerCase().includes('attachment') &&
            /MSIE (.*?);/i.test(userAgent) &&
            request.headers.get('x-forwarded-proto') === 'https'
        ) {
            const match = userAgent.match(/MSIE (.*?);/i)
            if (match) {
                const version = parseInt(match[1], 10)
                if (version < 9) {
                    this.headers.remove('Cache-Control')
                }
            }
        }
    }

}
