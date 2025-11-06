import { Cookie } from './Cookie'
import { H3Event, } from 'h3'
import { HeaderBag } from './HeaderBag'
import { HeaderUtility } from './HeaderUtility'

/**
 * ResponseHeaderBag is a container for Response HTTP headers.
 * for Node/H3 environments.
 */
export class ResponseHeaderBag extends HeaderBag {
    static readonly COOKIES_FLAT = 'flat'
    static readonly COOKIES_ARRAY = 'array'

    static readonly DISPOSITION_ATTACHMENT = 'attachment'
    static readonly DISPOSITION_INLINE = 'inline'

    protected computedCacheControl: Record<string, string | boolean> = {}
    protected cookies: Record<string, Record<string, Record<string, Cookie>>> = {}
    protected headerNames: Record<string, string> = {}

    constructor(
        /**
         * The current H3 H3Event instance
         */
        event: H3Event
    ) {
        super(Object.fromEntries(event.req.headers.entries()))

        if (!this.headers['cache-control']) {
            this.set('Cache-Control', '')
        }

        if (!this.headers['date']) {
            this.initDate()
        }
    }

    /**
     * Returns the headers with original capitalizations.
     */
    public allPreserveCase (): Record<string, string[]> {
        const headers: Record<string, string[]> = {}

        for (const [name, value] of Object.entries(this.all())) {
            const originalName = this.headerNames[name] ?? name
            headers[originalName] = value
        }

        return headers
    }

    public allPreserveCaseWithoutCookies (): Record<string, string[]> {
        const headers = this.allPreserveCase()

        if (this.headerNames['set-cookie']) {
            delete headers[this.headerNames['set-cookie']]
        }

        return headers
    }

    public replace (headers: Record<string, string | string[]> = {}): void {
        this.headerNames = {}
        super.replace(headers)

        if (!this.headers['cache-control']) {
            this.set('Cache-Control', '')
        }

        if (!this.headers['date']) {
            this.initDate()
        }
    }

    public all<K extends string | undefined> (key?: K): K extends string ? (string | null)[] : Record<string, (string | null)[]> {
        const headers = super.all() as Record<string, (string | null)[]>

        if (key) {
            const normalized = key.toLowerCase()
            if (normalized === 'set-cookie') {
                return this.getCookies().map(String)
            }

            return (headers[normalized as never] ?? []) as never
        }

        const cookies = this.getCookies().map(String)

        if (cookies.length > 0) {
            headers['set-cookie'] = cookies
        }

        return headers as never
    }

    public set (key: string, values: string | string[] | null, replace = true): void {
        const uniqueKey = key.toLowerCase()

        if (uniqueKey === 'set-cookie') {
            if (replace) this.cookies = {}
            for (const cookie of Array.isArray(values) ? values : [values]) {
                if (cookie) this.setCookie(Cookie.fromString(cookie))
            }
            this.headerNames[uniqueKey] = key
            return
        }

        this.headerNames[uniqueKey] = key
        super.set(key, values, replace)

        if (
            ['cache-control', 'etag', 'last-modified', 'expires'].includes(uniqueKey) &&
            this.computeCacheControlValue() !== ''
        ) {
            const computed = this.computeCacheControlValue()
            this.headers['cache-control'] = [computed]
            this.headerNames['cache-control'] = 'Cache-Control'
            this.computedCacheControl = this.parseCacheControl(computed)
        }
    }

    public remove (key: string): void {
        const uniqueKey = key.toLowerCase()
        delete this.headerNames[uniqueKey]

        if (uniqueKey === 'set-cookie') {
            this.cookies = {}
            return
        }

        super.remove(key)

        if (uniqueKey === 'cache-control') {
            this.computedCacheControl = {}
        }

        if (uniqueKey === 'date') {
            this.initDate()
        }
    }

    public hasCacheControlDirective (key: string): boolean {
        return key in this.computedCacheControl
    }

    public getCacheControlDirective (key: string): boolean | string | null {
        return this.computedCacheControl[key] ?? null
    }

    public setCookie (cookie: Cookie): void {
        const domain = cookie.getDomain() ?? ''
        const path = cookie.getPath() ?? '/'
        this.cookies[domain] ??= {}
        this.cookies[domain][path] ??= {}
        this.cookies[domain][path][cookie.getName()] = cookie
        this.headerNames['set-cookie'] = 'Set-Cookie'
    }

    public removeCookie (name: string, path: string = '/', domain: string | null = null): void {
        const d = domain ?? ''
        delete this.cookies[d]?.[path]?.[name]

        if (this.cookies[d] && Object.keys(this.cookies[d][path] ?? {}).length === 0) {
            delete this.cookies[d][path]
            if (Object.keys(this.cookies[d]).length === 0) delete this.cookies[d]
        }

        if (Object.keys(this.cookies).length === 0) {
            delete this.headerNames['set-cookie']
        }
    }

    /**
     * @throws {Error} if format is invalid
     */
    public getCookies (format: string = ResponseHeaderBag.COOKIES_FLAT): Cookie[] | Record<string, any> {
        if (![ResponseHeaderBag.COOKIES_FLAT, ResponseHeaderBag.COOKIES_ARRAY].includes(format)) {
            throw new Error(
                `Format "${format}" invalid (${ResponseHeaderBag.COOKIES_FLAT}, ${ResponseHeaderBag.COOKIES_ARRAY}).`
            )
        }

        if (format === ResponseHeaderBag.COOKIES_ARRAY) {
            return this.cookies
        }

        const flattened: Cookie[] = []
        for (const domain of Object.values(this.cookies)) {
            for (const path of Object.values(domain)) {
                for (const cookie of Object.values(path)) {
                    flattened.push(cookie)
                }
            }
        }

        return flattened
    }

    public clearCookie (
        name: string,
        path: string = '/',
        domain: string | null = null,
        secure = false,
        httpOnly = true,
        sameSite?: string | null,
        partitioned = false
    ): void {
        this.setCookie(new Cookie(name, null, 1, path, domain, secure, httpOnly, false, sameSite, partitioned))
    }

    public makeDisposition (disposition: string, filename: string, fallback = ''): string {
        return HeaderUtility.makeDisposition(disposition, filename, fallback)
    }

    protected computeCacheControlValue (): string {
        if (Object.keys(this.cacheControl).length === 0) {
            if (this.has('Last-Modified') || this.has('Expires')) {
                return 'private, must-revalidate'
            }
            return 'no-cache, private'
        }

        const header = this.getCacheControlHeader()
        if (this.cacheControl['public'] || this.cacheControl['private']) {
            return header
        }

        if (!this.cacheControl['s-maxage']) {
            return `${header}, private`
        }

        return header
    }

    private initDate (): void {
        const now = new Date().toUTCString()
        this.set('Date', now)
    }
}
