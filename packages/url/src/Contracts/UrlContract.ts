/**
 * Contract for URL manipulation and generation
 */
export interface UrlContract {
    /**
     * Set the scheme (protocol) of the URL
     */
    withScheme(scheme: string): this

    /**
     * Set the host of the URL
     */
    withHost(host: string): this

    /**
     * Set the port of the URL
     */
    withPort(port: number): this

    /**
     * Set the path of the URL
     */
    withPath(path: string): this

    /**
     * Set the query parameters of the URL
     */
    withQuery(query: Record<string, any>): this

    /**
     * Set the fragment (hash) of the URL
     */
    withFragment(fragment: string): this

    /**
     * Convert the URL to its string representation
     */
    toString(): string
}

/**
 * Contract for request-aware URL helpers
 */
export interface RequestAwareUrlContract {
    /**
     * Get the current request URL
     */
    current(): string

    /**
     * Get the full current URL with query string
     */
    full(): string

    /**
     * Get the previous request URL
     */
    previous(): string

    /**
     * Get the previous request path (without query string)
     */
    previousPath(): string

    /**
     * Get the current query parameters
     */
    query(): Record<string, any>
}
