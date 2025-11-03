import { H3Event } from 'h3'
import { ParamBag } from './ParamBag'

/**
 * ServerBag — a simplified version of Symfony's ServerBag
 * for Node/H3 environments.
 *
 * Responsible for extracting and normalizing HTTP headers
 * from the incoming request.
 */
export class ServerBag extends ParamBag {

    constructor(
        parameters: Record<string, string | undefined> = {},
        /**
         * The current H3 H3Event instance
         */
        event: H3Event
    ) {
        super(Object.fromEntries(
            Object.entries(parameters).map(([k, v]) => [k.toLowerCase(), v])
        ), event)
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
        return this.parameters[name.toLowerCase()]
    }

    /**
     * Returns true if a header exists.
     */
    public has (name: string): boolean {
        return name.toLowerCase() in this.parameters
    }
}
