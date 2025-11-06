import { HeaderUtility } from './HeaderUtility'

/**
 * Represents a Cookie
 */
export class Cookie {
    static readonly SAMESITE_NONE = 'none'
    static readonly SAMESITE_LAX = 'lax'
    static readonly SAMESITE_STRICT = 'strict'

    private expire: number
    private path: string
    private sameSite?: string | null
    private raw: boolean
    private partitioned: boolean
    private secureDefault: boolean = false


    private static readonly RESERVED_CHARS_LIST = '=,; \t\r\n\v\f'
    private static readonly RESERVED_CHARS_FROM = ['=', ',', ';', ' ', '\t', '\r', '\n', '\v', '\f']
    private static readonly RESERVED_CHARS_TO = ['%3D', '%2C', '%3B', '%20', '%09', '%0D', '%0A', '%0B', '%0C']

    constructor(
        private name: string,
        private value?: string | null,
        expire: number | string | Date = 0,
        path: string = '/',
        private domain?: string | null,
        private secure?: boolean | null,
        private httpOnly: boolean = true,
        raw: boolean = false,
        sameSite: string | null = Cookie.SAMESITE_LAX,
        partitioned: boolean = false
    ) {
        if (raw && [...Cookie.RESERVED_CHARS_LIST].some((c) => name.includes(c))) {
            throw new Error(`The cookie name "${name}" contains invalid characters.`)
        }
        if (!name) {
            throw new Error('The cookie name cannot be empty.')
        }

        this.expire = Cookie.expiresTimestamp(expire)
        this.path = path || '/'
        this.sameSite = this.withSameSite(sameSite).sameSite
        this.raw = raw
        this.partitioned = partitioned
    }

    /**
     * Create a Cookie instance from a Set-Cookie header string.
     */
    static fromString (cookie: string, decode = false): Cookie {
        const data: Record<string, any> = {
            expires: 0,
            path: '/',
            domain: null,
            secure: false,
            httponly: false,
            raw: !decode,
            samesite: null,
            partitioned: false,
        }

        const parts = HeaderUtility.split(cookie, ';=')
        const part = parts.shift()!
        const name = decode ? decodeURIComponent(part[0]) : part[0]
        const value = part[1] ? (decode ? decodeURIComponent(part[1]) : part[1]) : null

        Object.assign(data, HeaderUtility.combine(parts))
        data.expires = Cookie.expiresTimestamp(data.expires)

        if (data['max-age'] && (data['max-age'] > 0 || data.expires > Date.now() / 1000)) {
            data.expires = Math.floor(Date.now() / 1000) + Number(data['max-age'])
        }

        return new Cookie(
            name,
            value,
            data.expires,
            data.path,
            data.domain,
            data.secure,
            data.httponly,
            data.raw,
            data.samesite,
            data.partitioned
        )
    }

    /**
     * Convert various expiration formats into a timestamp (seconds)
     */
    private static expiresTimestamp (expire: number | string | Date = 0): number {
        if (expire instanceof Date) {
            return Math.floor(expire.getTime() / 1000)
        }

        if (typeof expire === 'string') {
            const parsed = Date.parse(expire)
            if (isNaN(parsed)) throw new Error('The cookie expiration time is not valid.')
            return Math.floor(parsed / 1000)
        }

        return expire > 0 ? expire : 0
    }

    private clone (): Cookie {
        return Object.assign(Object.create(Object.getPrototypeOf(this)), this)
    }

    withValue (value: string | null): Cookie {
        const c = this.clone()
        c.value = value
        return c
    }

    withDomain (domain: string | null): Cookie {
        const c = this.clone()
        c.domain = domain
        return c
    }

    withPath (path: string | null): Cookie {
        const c = this.clone()
        c.path = path || '/'
        return c
    }

    withSecure (secure = true): Cookie {
        const c = this.clone()
        c.secure = secure
        return c
    }

    withHttpOnly (httpOnly = true): Cookie {
        const c = this.clone()
        c.httpOnly = httpOnly
        return c
    }

    withRaw (raw = true): Cookie {
        const c = this.clone()
        c.raw = raw
        return c
    }

    withSameSite (sameSite?: string | null): Cookie {
        if (sameSite && ![Cookie.SAMESITE_LAX, Cookie.SAMESITE_STRICT, Cookie.SAMESITE_NONE].includes(sameSite.toLowerCase())) {
            throw new Error('The "sameSite" value must be "lax", "strict", "none" or null.')
        }
        const c = this.clone()
        c.sameSite = sameSite ? sameSite.toLowerCase() : null
        return c
    }

    withPartitioned (partitioned = true): Cookie {
        const c = this.clone()
        c.partitioned = partitioned
        return c
    }

    withExpires (expire: number | string | Date): Cookie {
        const c = this.clone()
        c.expire = Cookie.expiresTimestamp(expire)
        return c
    }

    getName (): string {
        return this.name
    }

    getValue (): string | undefined | null {
        return this.value
    }

    getDomain (): string | undefined | null {
        return this.domain
    }

    getPath (): string {
        return this.path
    }

    getExpiresTime (): number {
        return this.expire
    }

    getMaxAge (): number {
        if (this.expire === 0) return 0
        return this.expire - Math.floor(Date.now() / 1000)
    }

    /**
     * Checks whether the cookie should only be transmitted over a secure HTTPS connection from the client.
     */
    isSecure (): boolean {
        return this.secure ?? this.secureDefault
    }

    isHttpOnly (): boolean {
        return this.httpOnly
    }

    isRaw (): boolean {
        return this.raw
    }

    getSameSite (): string | undefined | null {
        return this.sameSite
    }

    isPartitioned (): boolean {
        return this.partitioned
    }

    /**
     * Whether this cookie is about to be cleared.
     */
    public isCleared (): boolean {
        return 0 !== this.expire && this.expire < new Date().getTime()
    }

    /**
     * Convert the cookie to a Set-Cookie header string.
     */
    toString (): string {
        const from = Cookie.RESERVED_CHARS_FROM
        const to = Cookie.RESERVED_CHARS_TO

        const encodeName = (name: string) =>
            this.isRaw()
                ? name
                : name.replaceAll(new RegExp(from.map((x) => `\\${x}`).join('|'), 'g'), (m) => to[from.indexOf(m)])

        const encodeValue = (val: string) => (this.isRaw() ? val : encodeURIComponent(val))

        let str = `${encodeName(this.name)}=`

        if (!this.value) {
            str += `deleted; expires=${new Date(Date.now() - 31536001000).toUTCString()}; Max-Age=0`
        } else {
            str += encodeValue(this.value)
            if (this.expire !== 0) {
                const expiresAt = new Date(this.expire * 1000).toUTCString()
                str += `; expires=${expiresAt}; Max-Age=${this.getMaxAge()}`
            }
        }

        if (this.path) str += `; path=${this.path}`
        if (this.domain) str += `; domain=${this.domain}`
        if (this.isSecure()) str += '; secure'
        if (this.isHttpOnly()) str += '; httponly'
        if (this.sameSite) str += `; samesite=${this.sameSite}`
        if (this.partitioned) str += '; partitioned'

        return str
    }

    /**
     * @param bool $default The default value of the "secure" flag when it is set to null
     */
    public setSecureDefault (defaultValue: boolean): void {
        this.secureDefault = defaultValue
    }
}
