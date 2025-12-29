import type { IRequest } from './IRequest'

/**
 * Interface for the Response contract, defining methods for handling HTTP responses.
 */
export abstract class IHttpResponse {
    /**
     * Set HTTP status code.
     */
    abstract setStatusCode (code: number, text?: string): this;
    /**
     * Retrieves the status code for the current web response.
     */
    abstract getStatusCode (): number;
    /**
     * Sets the response charset.
     */
    abstract setCharset (charset: string): this;
    /**
     * Retrieves the response charset.
     */
    abstract getCharset (): string | undefined;
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
    abstract isCacheable (): boolean;
    /**
     * Returns true if the response is "fresh".
     *
     * Fresh responses may be served from cache without any interaction with the
     * origin. A response is considered fresh when it includes a Cache-Control/max-age
     * indicator or Expires header and the calculated age is less than the freshness lifetime.
     */
    abstract isFresh (): boolean;
    /**
     * Returns true if the response includes headers that can be used to validate
     * the response with the origin server using a conditional GET request.
     */
    abstract isValidateable (): boolean;
    /**
     * Sets the response content.
     */
    abstract setContent (content?: any): this;
    /**
     * Gets the current response content.
     */
    abstract getContent (): any;
    /**
     * Set a header.
     */
    abstract setHeader (name: string, value: string): this;
    /**
     * Sets the HTTP protocol version (1.0 or 1.1).
     */
    abstract setProtocolVersion (version: string): this;
    /**
     * Gets the HTTP protocol version.
     */
    abstract getProtocolVersion (): string;
    /**
     * Marks the response as "private".
     *
     * It makes the response ineligible for serving other clients.
     */
    abstract setPrivate (): this;
    /**
     * Marks the response as "public".
     *
     * It makes the response eligible for serving other clients.
     */
    abstract setPublic (): this;
    /**
     * Returns the Date header as a DateTime instance.
     * @throws {RuntimeException} When the header is not parseable
     */
    abstract getDate (): any;
    /**
    * Returns the age of the response in seconds.
    *
    * @final
    */
    abstract getAge (): number;
    /**
     * Marks the response stale by setting the Age header to be equal to the maximum age of the response.
     */
    abstract expire (): this;
    /**
     * Returns the value of the Expires header as a DateTime instance.
     *
     * @final
     */
    abstract getExpires (): any;
    /**
     * Returns the number of seconds after the time specified in the response's Date
     * header when the response should no longer be considered fresh.
     *
     * First, it checks for a s-maxage directive, then a max-age directive, and then it falls
     * back on an expires header. It returns null when no maximum age can be established.
     */
    abstract getMaxAge (): number | undefined;
    /**
     * Sets the number of seconds after which the response should no longer be considered fresh.
     *
     * This method sets the Cache-Control max-age directive.
     */
    abstract setMaxAge (value: number): this;
    /**
     * Sets the number of seconds after which the response should no longer be returned by shared caches when backend is down.
     *
     * This method sets the Cache-Control stale-if-error directive.
     */
    abstract setStaleIfError (value: number): this;
    /**
     * Sets the number of seconds after which the response should no longer return stale content by shared caches.
     *
     * This method sets the Cache-Control stale-while-revalidate directive.
     */
    abstract setStaleWhileRevalidate (value: number): this;
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
    abstract getTtl (): number | undefined;
    /**
     * Sets the response's time-to-live for shared caches in seconds.
     *
     * This method adjusts the Cache-Control/s-maxage directive.
     */
    abstract setTtl (seconds: number): this;
    /**
     * Sets the response's time-to-live for private/client caches in seconds.
     *
     * This method adjusts the Cache-Control/max-age directive.
     */
    abstract setClientTtl (seconds: number): this;
    /**
     * Sets the number of seconds after which the response should no longer be considered fresh by shared caches.
     *
     * This method sets the Cache-Control s-maxage directive.
     */
    abstract setSharedMaxAge (value: number): this;
    /**
     * Returns the Last-Modified HTTP header as a DateTime instance.
     *
     * @throws \RuntimeException When the HTTP header is not parseable
     *
     * @final
     */
    abstract getLastModified (): any;
    /**
     * Sets the Last-Modified HTTP header with a DateTime instance.
     *
     * Passing null as value will remove the header.
     *
     * @return $this
     *
     * @final
     */
    abstract setLastModified (date?: any): this;
    /**
     * Returns the literal value of the ETag HTTP header.
     */
    abstract getEtag (): string | null;
    /**
     * Sets the ETag value.
     *
     * @param etag The ETag unique identifier or null to remove the header
     * @param weak Whether you want a weak ETag or not
     */
    abstract setEtag (etag?: string, weak?: boolean): this;
    /**
     * Sets the response's cache headers (validation and/or expiration).
     *
     * Available options are: must_revalidate, no_cache, no_store, no_transform, public, private, proxy_revalidate, max_age, s_maxage, immutable, last_modified and etag.
     *
     * @throws {InvalidArgumentException}
     */
    abstract setCache (options: any): this;
    /**
     * Modifies the response so that it conforms to the rules defined for a 304 status code.
     *
     * This sets the status, removes the body, and discards any headers
     * that MUST NOT be included in 304 responses.
     * @see https://tools.ietf.org/html/rfc2616#section-10.3.5
     */
    abstract setNotModified (): this;
    /**
     * Add an array of headers to the response.
     *
     */
    abstract withHeaders (headers: any): this;
    /**
     * Set the exception to attach to the response.
     */
    abstract withException (e: Error): this;
    /**
     * Throws the response in a HttpResponseException instance.
     *
     * @throws {HttpResponseException}
     */
    abstract throwResponse (): void;
    /**
     * Is response invalid?
     *
     * @see https://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html
     */
    abstract isInvalid (): boolean;
    /**
     * Is response informative?
     */
    abstract isInformational (): boolean;
    /**
     * Is response successful?
     */
    abstract isSuccessful (): boolean;
    /**
     * Is the response a redirect?
     */
    abstract isRedirection (): boolean;
    /**
     * Is there a client error?
     */
    abstract isClientError (): boolean;
    /**
     * Was there a server side error?
     */
    abstract isServerError (): boolean;
    /**
     * Is the response OK?
     */
    abstract isOk (): boolean;
    /**
     * Is the response forbidden?
     */
    abstract isForbidden (): boolean;
    /**
     * Is the response a not found error?
     */
    abstract isNotFound (): boolean;
    /**
     * Is the response a redirect of some form?
     */
    abstract isRedirect (location?: string | null): boolean;
    /**
     * Is the response empty?
     */
    abstract isEmpty (): boolean;
    /**
     * Apply headers before sending response.
     */
    abstract sendHeaders (statusCode?: number): this;
    /**
     * Prepares the Response before it is sent to the client.
     *
     * This method tweaks the Response to ensure that it is
     * compliant with RFC 2616. Most of the changes are based on
     * the Request that is "associated" with this Response.
     **/
    abstract prepare (request: IRequest): this;
}
