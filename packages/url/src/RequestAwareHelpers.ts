import type { Application } from '@h3ravel/core'
import type { IRequest } from '@h3ravel/shared'
import { RouteParams } from './Contracts/UrlContract'

/**
 * Request-aware URL helper class
 */
export class RequestAwareHelpers {
    private readonly baseUrl: string = ''

    constructor(private app: Application) {
        try {
            this.baseUrl = config('app.url', 'http://localhost:3000')
        } catch {/** */ }
    }

    /**
     * Get the current request instance
     */
    private getCurrentRequest (): IRequest {
        const request = this.app.make('http.request')
        if (!request) {
            throw new Error('Request instance not available in current context')
        }
        return request
    }

    /**
     * Get the current request URL (path only, no query string)
     */
    current (): string {
        const request = this.getCurrentRequest()
        const event = request.getEvent()

        // Get the path from the request
        const raw = event.req.url ?? '/'
        const url = new URL(raw, 'http://localhost')
        return url.pathname
    }

    /**
     * Get the full current URL with query string
     */
    full (): string {
        const request = this.getCurrentRequest()
        const event = request.getEvent()

        // Get the full URL including query string
        const requestUrl = event.req.url ?? '/'

        // If requestUrl is already absolute, use it directly, otherwise combine with baseUrl
        if (requestUrl.startsWith('http')) {
            return requestUrl
        }

        const fullUrl = new URL(requestUrl, this.baseUrl)
        return fullUrl.toString()
    }

    /**
     * Get the previous request URL from session or referrer
     */
    previous (): string {
        const request = this.getCurrentRequest()
        const event = request.getEvent()

        // Try to get from session first (if session is available)
        // For now, fallback to HTTP referrer header
        const headers = (event as any)?.node?.req?.headers as Record<string, string | string[] | undefined> | undefined
        // console.log(headers)
        let referrer = headers?.referer ?? headers?.referrer
        if (Array.isArray(referrer)) referrer = referrer[0]
        if (referrer) return referrer

        // Fallback to current URL if no referrer
        return this.current()
    }

    /**
     * Get the previous request path (without query string)
     */
    previousPath (): string {
        const previousUrl = this.previous()

        try {
            const url = new URL(previousUrl)
            return url.pathname
        } catch {
            // If previous URL is not a valid URL, return as-is
            return previousUrl
        }
    }

    /**
     * Get the current query parameters
     */
    query (): RouteParams {
        const request = this.getCurrentRequest()
        return request.query || {}
    }
}

/**
 * Global helper function factory
 */
export function createUrlHelper (app: Application): () => RequestAwareHelpers {
    return () => new RequestAwareHelpers(app)
}
