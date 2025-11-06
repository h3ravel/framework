import { IRequest } from './IRequest'

/**
 * Interface for the Response contract, defining methods for handling HTTP responses.
 */
export interface IHttpResponse {
    /**
     * Set HTTP status code.
     */
    setStatusCode (code: number, text?: string): this;
    /**
     * Retrieves the status code for the current web response.
     */
    getStatusCode (): number;
    /**
     * Sets the response charset.
     */
    setCharset (charset: string): this;
    /**
     * Retrieves the response charset.
     */
    getCharset (): string | undefined;
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
    isCacheable (): boolean;
    /**
     * Returns true if the response is "fresh".
     *
     * Fresh responses may be served from cache without any interaction with the
     * origin. A response is considered fresh when it includes a Cache-Control/max-age
     * indicator or Expires header and the calculated age is less than the freshness lifetime.
     */
    isFresh (): boolean;
    /**
     * Returns true if the response includes headers that can be used to validate
     * the response with the origin server using a conditional GET request.
     */
    isValidateable (): boolean;
    /**
     * Sets the response content.
     */
    setContent (content?: any): this;
    /**
     * Gets the current response content.
     */
    getContent (): any;
    /**
     * Set a header.
     */
    setHeader (name: string, value: string): this;
    /**
     * Sets the HTTP protocol version (1.0 or 1.1).
     */
    setProtocolVersion (version: string): this;
    /**
     * Gets the HTTP protocol version.
     */
    getProtocolVersion (): string;
    /**
     * Marks the response as "private".
     *
     * It makes the response ineligible for serving other clients.
     */
    setPrivate (): this;
    /**
     * Marks the response as "public".
     *
     * It makes the response eligible for serving other clients.
     */
    setPublic (): this;
    /**
     * Returns the Date header as a DateTime instance.
     * @throws {RuntimeException} When the header is not parseable
     */
    getDate (): any;
    /**
     * Returns the age of the response in seconds.
     *
     * @final
     */
    getAge (): number;
    /**
     * Marks the response stale by setting the Age header to be equal to the maximum age of the response.
     */
    expire (): this;
    /**
     * Returns the value of the Expires header as a DateTime instance.
     *
     * @final
     */
    getExpires (): any;
    /**
     * Returns the number of seconds after the time specified in the response's Date
     * header when the response should no longer be considered fresh.
     *
     * First, it checks for a s-maxage directive, then a max-age directive, and then it falls
     * back on an expires header. It returns null when no maximum age can be established.
     */
    getMaxAge (): number | undefined;
    /**
     * Sets the number of seconds after which the response should no longer be considered fresh.
     *
     * This method sets the Cache-Control max-age directive.
     */
    setMaxAge (value: number): this;
    /**
     * Sets the number of seconds after which the response should no longer be returned by shared caches when backend is down.
     *
     * This method sets the Cache-Control stale-if-error directive.
     */
    setStaleIfError (value: number): this;
    /**
     * Sets the number of seconds after which the response should no longer return stale content by shared caches.
     *
     * This method sets the Cache-Control stale-while-revalidate directive.
     */
    setStaleWhileRevalidate (value: number): this;
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
    getTtl (): number | undefined;
    /**
     * Sets the response's time-to-live for shared caches in seconds.
     *
     * This method adjusts the Cache-Control/s-maxage directive.
     */
    setTtl (seconds: number): this;
    /**
     * Sets the response's time-to-live for private/client caches in seconds.
     *
     * This method adjusts the Cache-Control/max-age directive.
     */
    setClientTtl (seconds: number): this;
    /**
     * Sets the number of seconds after which the response should no longer be considered fresh by shared caches.
     *
     * This method sets the Cache-Control s-maxage directive.
     */
    setSharedMaxAge (value: number): this;
    /**
     * Returns the Last-Modified HTTP header as a DateTime instance.
     *
     * @throws \RuntimeException When the HTTP header is not parseable
     *
     * @final
     */
    getLastModified (): any;
    /**
     * Sets the Last-Modified HTTP header with a DateTime instance.
     *
     * Passing null as value will remove the header.
     *
     * @return $this
     *
     * @final
     */
    setLastModified (date?: any): this;
    /**
     * Returns the literal value of the ETag HTTP header.
     */
    getEtag (): string | null;
    /**
     * Sets the ETag value.
     *
     * @param etag The ETag unique identifier or null to remove the header
     * @param weak Whether you want a weak ETag or not
     */
    setEtag (etag?: string, weak?: boolean): this;
    /**
     * Sets the response's cache headers (validation and/or expiration).
     *
     * Available options are: must_revalidate, no_cache, no_store, no_transform, public, private, proxy_revalidate, max_age, s_maxage, immutable, last_modified and etag.
     *
     * @throws {InvalidArgumentException}
     */
    setCache (options: any): this;
    /**
     * Modifies the response so that it conforms to the rules defined for a 304 status code.
     *
     * This sets the status, removes the body, and discards any headers
     * that MUST NOT be included in 304 responses.
     * @see https://tools.ietf.org/html/rfc2616#section-10.3.5
     */
    setNotModified (): this;
    /**
     * Add an array of headers to the response.
     *
     */
    withHeaders (headers: any): this;
    /**
     * Set the exception to attach to the response.
     */
    withException (e: Error): this;
    /**
     * Throws the response in a HttpResponseException instance.
     *
     * @throws {HttpResponseException}
     */
    throwResponse (): void;
    /**
     * Is response invalid?
     *
     * @see https://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html
     */
    isInvalid (): boolean;
    /**
     * Is response informative?
     */
    isInformational (): boolean;
    /**
     * Is response successful?
     */
    isSuccessful (): boolean;
    /**
     * Is the response a redirect?
     */
    isRedirection (): boolean;
    /**
     * Is there a client error?
     */
    isClientError (): boolean;
    /**
     * Was there a server side error?
     */
    isServerError (): boolean;
    /**
     * Is the response OK?
     */
    isOk (): boolean;
    /**
     * Is the response forbidden?
     */
    isForbidden (): boolean;
    /**
     * Is the response a not found error?
     */
    isNotFound (): boolean;
    /**
     * Is the response a redirect of some form?
     */
    isRedirect (location?: string | null): boolean;
    /**
     * Is the response empty?
     */
    isEmpty (): boolean;
    /**
     * Apply headers before sending response.
     */
    sendHeaders (statusCode?: number): this;
    /**
     * Prepares the Response before it is sent to the client.
     *
     * This method tweaks the Response to ensure that it is
     * compliant with RFC 2616. Most of the changes are based on
     * the Request that is "associated" with this Response.
     **/
    prepare (request: IRequest): this;
}
