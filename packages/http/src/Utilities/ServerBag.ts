import { H3Event, getRequestProtocol } from 'h3'

import { ParamBag } from './ParamBag'
import { Str } from '@h3ravel/support'

/**
 * ServerBag — a simplified version of Symfony's ServerBag
 * for Node/H3 environments.
 *
 * Responsible for extracting and normalizing HTTP headers
 * from the incoming request.
 */
export class ServerBag extends ParamBag {

    private static serverData: {
        SERVER_PROTOCOL?: string
        REQUEST_METHOD?: string
        REQUEST_URI?: string
        PATH_INFO?: string
        QUERY_STRING?: string
        SERVER_NAME?: string
        SERVER_PORT?: string
        REMOTE_ADDR?: string
        REMOTE_PORT?: string
        HTTP_HOST?: string
        HTTP_USER_AGENT?: string
        HTTP_ACCEPT?: string
        HTTP_ACCEPT_LANGUAGE?: string
        HTTP_ACCEPT_ENCODING?: string
        HTTP_REFERER?: string
        HTTPS?: string
    } = {}

    constructor(
        parameters: Record<string, string | undefined> = {},
        /**
         * The current H3 H3Event instance
         */
        event: H3Event
    ) {
        super({}, event)
        this.add(Object.fromEntries(Object.entries(parameters).map(([k, v]) => [k.toLowerCase(), v])))
        this.add(Object.fromEntries(Object.entries(ServerBag.initialize(event, this.getHeaders())).map(([k, v]) => [Str.slugify(k, '-', { '_': '-' }), v])))
        this.add(ServerBag.initialize(event, this.getHeaders()))
    }

    static initialize (event: H3Event, headers: Record<string, string>) {
        const req = event.req
        // const socket = this.event.req?? {}
        const url = new URL(req.url ?? '/')
        const host = headers.host
        const method = req.method ?? 'GET'
        const protocol = getRequestProtocol(event)
        const isHttps = protocol === 'https' || !!event.req.headers.get('x-forwarded-proto')?.includes('https')

        // Populate keys similar to PHP/Laravel $_SERVER / Symfony Request->server
        // this.serverData.SERVER_PROTOCOL = `HTTP/${(req?.httpVersion ?? '1.1')}`
        this.serverData.SERVER_PROTOCOL = protocol
        this.serverData.REQUEST_METHOD = method
        this.serverData.REQUEST_URI = url.href
        this.serverData.PATH_INFO = url.pathname
        this.serverData.QUERY_STRING = url.search
        this.serverData.SERVER_NAME = host
        this.serverData.SERVER_PORT = url.port
        this.serverData.REMOTE_ADDR = undefined
        this.serverData.REMOTE_PORT = undefined
        this.serverData.HTTP_HOST = headers.HOST ?? headers.HTTP_HOST ?? host
        this.serverData.HTTP_USER_AGENT = headers.USER_AGENT ?? headers.HTTP_USER_AGENT ?? ''
        this.serverData.HTTP_ACCEPT = headers.ACCEPT ?? ''
        this.serverData.HTTP_ACCEPT_LANGUAGE = headers.ACCEPT_LANGUAGE ?? headers.HTTP_ACCEPT_LANGUAGE ?? ''
        this.serverData.HTTP_ACCEPT_ENCODING = headers.ACCEPT_ENCODING ?? headers.HTTP_ACCEPT_ENCODING ?? ''
        this.serverData.HTTP_REFERER = headers.REFERER ?? headers.HTTP_REFERER ?? ''
        this.serverData.HTTPS = isHttps ? 'on' : 'off'

        // this.serverData._headers = headers
        // this.serverData._env = process.env
        return this.serverData
    }

    /**
     * Returns all request headers, normalized to uppercase with underscores.
     * Example: content-type → CONTENT_TYPE
     */
    public getHeaders (): Record<string, string> {
        const headers: Record<string, string> = {}

        for (const [key, value] of Object.entries(this.parameters)) {
            if (value === undefined || value === '') continue

            switch (key) {
                case 'accept':
                case 'content-type':
                case 'content-length':
                case 'content-md5':
                case 'authorization':
                    headers[key.toUpperCase().replace(/-/g, '_')] = value
                    break
                default:
                    // Regular HTTP headers (e.g., accept-language → HTTP_ACCEPT_LANGUAGE)
                    headers[`HTTP_${key.toUpperCase().replace(/-/g, '_')}`] = value
            }
        }

        // Normalize Authorization header (if present)
        if (headers['HTTP_AUTHORIZATION'] || headers['AUTHORIZATION']) {
            const auth =
                headers['HTTP_AUTHORIZATION'] || headers['AUTHORIZATION'] || ''

            if (auth.toLowerCase().startsWith('basic ')) {
                const decoded = Buffer.from(auth.slice(6), 'base64').toString()
                const [user, pass] = decoded.split(':', 2)
                headers['AUTH_TYPE'] = 'Basic'
                headers['AUTH_USER'] = user
                headers['AUTH_PASS'] = pass
            } else if (auth.toLowerCase().startsWith('bearer ')) {
                headers['AUTH_TYPE'] = 'Bearer'
                headers['AUTH_TOKEN'] = auth.slice(7)
            } else if (auth.toLowerCase().startsWith('digest ')) {
                headers['AUTH_TYPE'] = 'Digest'
                headers['AUTH_DIGEST'] = auth
            }
        }

        return headers
    }

    /**
     * Returns a specific header by name, case-insensitive.
     */
    public get (name: string): string | undefined {
        return this.parameters[name.toLowerCase()] || this.parameters[name]
    }

    /**
     * Returns true if a header exists.
     */
    public has (name: string): boolean {
        return name.toLowerCase() in this.parameters || name in this.parameters
    }
}
