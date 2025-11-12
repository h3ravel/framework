import { DateTime, RuntimeException } from '@h3ravel/support'

/**
 * HeaderBag — A container for HTTP headers
 * for Node/H3 environments.
 */
export class HeaderBag implements Iterable<[string, (string | null)[]]> {
    protected static readonly UPPER = '_ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    protected static readonly LOWER = '-abcdefghijklmnopqrstuvwxyz'

    protected headers: Record<string, (string | null)[]> = {}
    protected headerNames: Record<string, string> = {}
    protected cacheControl: Record<string, string | boolean> = {}

    constructor(headers: Record<string, string | string[] | null> = {}) {
        for (const [key, values] of Object.entries(headers)) {
            this.set(key, values)
        }
    }

    /**
     * Returns all headers as string (for debugging / toString) 
     * 
     * @returns 
     */
    public toString (): string {
        const headers = this.all()
        if (!Object.keys(headers).length) return ''

        const sortedKeys = Object.keys(headers).sort()
        const max = Math.max(...sortedKeys.map(k => k.length)) + 1
        let content = ''

        for (const name of sortedKeys) {
            const values: string[] = headers[name as never] ?? []
            const displayName = name
                .split('-')
                .map(p => p.charAt(0).toUpperCase() + p.slice(1))
                .join('-')
            for (const value of values) {
                content += `${displayName + ':'}`.padEnd(max + 1, ' ') + `${value ?? ''}\r\n`
            }
        }
        return content
    }

    /**
     * Returns all headers or specific header list
     * 
     * @param key 
     * @returns 
     */
    // public all (key?: string): Record<string, (string | null)[]> | (string | null)[] {
    public all<K extends string | undefined> (key?: K): K extends string ? (string | null)[] : Record<string, (string | null)[]> {
        if (key !== undefined) {
            return (this.headers[this.normalizeKey(key)] ?? []) as never
        }
        return this.headers as never
    }

    /**
     * Returns header keys
     * 
     * @returns 
     */
    public keys (): string[] {
        return Object.keys(this.headers)
    }

    /**
     * Replace all headers with new set
     * 
     * @param headers 
     */
    public replace (headers: Record<string, string | string[] | null> = {}): void {
        this.headers = {}
        this.add(headers)
    }

    /**
     * Add multiple headers
     * 
     * @param headers 
     */
    public add (headers: Record<string, string | string[] | null>): void {
        for (const [key, values] of Object.entries(headers)) {
            this.set(key, values)
        }
    }

    /**
     * Returns first header value by name or default
     * 
     * @param key 
     * @param defaultValue 
     * @returns 
     */
    public get<R = undefined> (
        key: string,
        defaultValue: string | null = null
    ): R extends undefined ? string | null : R {
        const headers = this.all(key) || this.all('http-' + key)
        if (!headers.length) return defaultValue as R extends undefined ? string | null : R
        return headers[0] as R extends undefined ? string | null : R
    }

    /**
     * Sets a header by name.
     * 
     * @param replace Whether to replace existing values (default true)
     */
    public set (key: string, values: string | string[] | null, replace = true): void {
        const normalized = this.normalizeKey(key)

        if (Array.isArray(values)) {
            const valList = values.map(v => (v === undefined ? null : v))
            if (replace || !this.headers[normalized]) {
                this.headers[normalized] = valList
            } else {
                this.headers[normalized].push(...valList)
            }
        } else {
            const val = values === undefined ? null : values
            if (replace || !this.headers[normalized]) {
                this.headers[normalized] = [val]
            } else {
                this.headers[normalized].push(val)
            }
        }

        if (normalized === 'cache-control') {
            this.cacheControl = this.parseCacheControl((this.headers[normalized] ?? []).join(', '))
        }
    }

    /**
     * Returns true if header exists
     * 
     * @param key 
     * @returns 
     */
    public has (key: string): boolean {
        return Object.prototype.hasOwnProperty.call(this.headers, this.normalizeKey(key))
    }

    /**
     * Returns true if header contains value
     * 
     * @param key 
     * @param value 
     * @returns 
     */
    public contains (key: string, value: string): boolean {
        return (this.all(key) as (string | null)[]).includes(value)
    }

    /**
     * Removes a header
     * 
     * @param key 
     */
    public remove (key: string): void {
        const normalized = this.normalizeKey(key)
        delete this.headers[normalized]
        if (normalized === 'cache-control') {
            this.cacheControl = {}
        }
    }

    /**
     * Returns parsed date from header
     * 
     * @param key 
     * @param defaultValue 
     * @returns 
     */
    public getDate (key: string, defaultValue: Date | null = null): DateTime | undefined {
        const value = this.get(key)
        if (!value) {
            return defaultValue ? DateTime.parse(defaultValue) : undefined
        }

        const parsed = DateTime.parse(value)
        if (isNaN(parsed.unix())) {
            throw new RuntimeException(`The "${key}" HTTP header is not parseable (${value}).`)
        }

        return parsed
    }

    /**
     * Adds a Cache-Control directive
     * 
     * @param key 
     * @param value 
     */
    public addCacheControlDirective (key: string, value: string | boolean = true): void {
        this.cacheControl[key] = value
        this.set('Cache-Control', this.getCacheControlHeader())
    }

    /**
     * Returns true if Cache-Control directive is defined
     * 
     * @param key 
     * @returns 
     */
    public hasCacheControlDirective (key: string): boolean {
        return Object.prototype.hasOwnProperty.call(this.cacheControl, key)
    }

    /**
     * Returns a Cache-Control directive value by name
     * 
     * @param key 
     * @returns 
     */
    public getCacheControlDirective (key: string): string | boolean | null {
        return this.cacheControl[key] ?? null
    }

    /**
     * Removes a Cache-Control directive
     * 
     * @param key 
     * @returns 
     */
    public removeCacheControlDirective (key: string): void {
        delete this.cacheControl[key]
        this.set('Cache-Control', this.getCacheControlHeader())
    }

    /**
     * Number of headers
     * 
     * @param key 
     * @returns 
     */
    public count (): number {
        return Object.keys(this.headers).length
    }

    /**
     * Normalize header name to lowercase with hyphens
     * 
     * @param key 
     * @returns 
     */
    protected normalizeKey (key: string): string {
        return key
            .replace(/[A-Z_]/g, (ch) => {
                const idx = HeaderBag.UPPER.indexOf(ch)
                return idx === -1 ? ch : HeaderBag.LOWER[idx]
            })
            .toLowerCase()
    }

    /**
     * Generates Cache-Control header string
     * 
     * @param header 
     * @returns 
     */
    protected getCacheControlHeader (): string {
        const entries = Object.entries(this.cacheControl).sort(([a], [b]) => a.localeCompare(b))
        return entries
            .map(([k, v]) => (v === true ? k : v === false ? '' : `${k}=${v}`))
            .filter(Boolean)
            .join(', ')
    }

    /**
     * Parses Cache-Control header
     * 
     * @param header 
     * @returns 
     */
    protected parseCacheControl (header: string): Record<string, string | boolean> {
        const directives: Record<string, string | boolean> = {}
        const parts = header.split(',').map(p => p.trim()).filter(Boolean)

        for (const part of parts) {
            const [key, val] = part.split('=', 2)
            directives[key.trim()] = val !== undefined ? val.trim() : true
        }

        return directives
    }

    /**
     * Iterator support
     * @returns 
     */
    [Symbol.iterator] (): Iterator<[string, (string | null)[]]> {
        return Object.entries(this.headers)[Symbol.iterator]()
    }
}
