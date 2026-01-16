/**
 * Contract for request-aware URL helpers
 */
export abstract class IRequestAwareUrl {
    /**
     * Get the current request URL
     */
    abstract current (): string

    /**
     * Get the full current URL with query string
     */
    abstract full (): string

    /**
     * Get the previous request URL
     */
    abstract previous (): string

    /**
     * Get the previous request path (without query string)
     */
    abstract previousPath (): string

    /**
     * Get the current query parameters
     */
    abstract query (): Record<string, any>
}