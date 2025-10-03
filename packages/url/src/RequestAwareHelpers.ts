import type { Application } from '@h3ravel/core'
import type { IRequest } from '@h3ravel/shared'

/**
 * Request-aware URL helper class
 */
export class RequestAwareHelpers {
    constructor(private app: Application) {}

    /**
     * Get the current request instance
     */
    private getCurrentRequest(): IRequest {
        const request = this.app.make('http.request') as unknown as IRequest
        if (!request) {
            throw new Error('Request instance not available in current context')
        }
        return request
    }

    /**
     * Get the current request URL (path only, no query string)
     */
    current(): string {
        const request = this.getCurrentRequest()
        const event = request.getEvent()
        
        // Get the path from the request
        const raw = (event as any)?.node?.req?.url ?? '/'
        const url = new URL(raw, 'http://localhost')
        return url.pathname
    }

    /**
     * Get the full current URL with query string
     */
    full(): string {
        const request = this.getCurrentRequest()
        const event = request.getEvent()
        
        // Get the full URL including query string
        const cfg = this.app.make('config') as unknown as { get?: (k: string) => string | undefined }
        const baseUrl = (cfg?.get?.('app.url')) || process.env.APP_URL || 'http://localhost:3000'
        const requestUrl = (event as any)?.node?.req?.url || '/'
        
        // If requestUrl is already absolute, use it directly, otherwise combine with baseUrl
        if (requestUrl.startsWith('http')) {
            return requestUrl
        }
        
        const fullUrl = new URL(requestUrl, baseUrl)
        return fullUrl.toString()
    }

    /**
     * Get the previous request URL from session or referrer
     */
    previous(): string {
        const request = this.getCurrentRequest()
        const event = request.getEvent()
        
        // Try to get from session first (if session is available)
        // For now, fallback to HTTP referrer header
        const headers = (event as any)?.node?.req?.headers as Record<string, string | string[] | undefined> | undefined
        let referrer = headers?.referer ?? headers?.referrer
        if (Array.isArray(referrer)) referrer = referrer[0]
        if (referrer) return referrer
        
        // Fallback to current URL if no referrer
        return this.current()
    }

    /**
     * Get the previous request path (without query string)
     */
    previousPath(): string {
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
    query(): Record<string, unknown> {
        const request = this.getCurrentRequest()
        return request.query || {}
    }
}

/**
 * Global helper function factory
 */
export function createUrlHelper(app: Application): () => RequestAwareHelpers {
    return () => new RequestAwareHelpers(app)
}
