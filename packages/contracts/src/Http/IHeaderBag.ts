/**
 * HeaderBag — A container for HTTP headers
 * for H3ravel App.
 */
export abstract class IHeaderBag implements Iterable<[string, (string | null)[]]> {
    /**
     * Returns all headers as string (for debugging / toString)
     *
     * @returns
     */
    abstract toString (): string;
    /**
     * Returns all headers or specific header list
     *
     * @param key
     * @returns
     */
    abstract all<K extends string | undefined> (key?: K): K extends string ? (string | null)[] : Record<string, (string | null)[]>;
    /**
     * Returns header keys
     *
     * @returns
     */
    abstract keys (): string[];
    /**
     * Replace all headers with new set
     *
     * @param headers
     */
    abstract replace (headers?: Record<string, string | string[] | null>): void;
    /**
     * Add multiple headers
     *
     * @param headers
     */
    abstract add (headers: Record<string, string | string[] | null>): void;
    /**
     * Returns first header value by name or default
     *
     * @param key
     * @param defaultValue
     * @returns
     */
    abstract get<R = undefined> (key: string, defaultValue?: string | null | undefined): R extends undefined ? string | null | undefined : R;
    /**
     * Sets a header by name.
     *
     * @param replace Whether to replace existing values (default true)
     */
    abstract set (key: string, values: string | string[] | null, replace?: boolean): void;
    /**
     * Returns true if header exists
     *
     * @param key
     * @returns
     */
    abstract has (key: string): boolean;
    /**
     * Returns true if header contains value
     *
     * @param key
     * @param value
     * @returns
     */
    abstract contains (key: string, value: string): boolean;
    /**
     * Removes a header
     *
     * @param key
     */
    abstract remove (key: string): void;
    /**
     * Returns parsed date from header
     *
     * @param key
     * @param defaultValue
     * @returns
     */
    abstract getDate (key: string, defaultValue?: Date | null): any;
    /**
     * Adds a Cache-Control directive
     *
     * @param key
     * @param value
     */
    abstract addCacheControlDirective (key: string, value?: string | boolean): void;
    /**
     * Returns true if Cache-Control directive is defined
     *
     * @param key
     * @returns
     */
    abstract hasCacheControlDirective (key: string): boolean;
    /**
     * Returns a Cache-Control directive value by name
     *
     * @param key
     * @returns
     */
    abstract getCacheControlDirective (key: string): string | boolean | null;
    /**
     * Removes a Cache-Control directive
     *
     * @param key
     * @returns
     */
    abstract removeCacheControlDirective (key: string): void;
    /**
     * Number of headers
     *
     * @param key
     * @returns
     */
    abstract count (): number;
    /**
     * Iterator support
     * @returns
     */
    abstract [Symbol.iterator] (): Iterator<[string, (string | null)[]]>;
}