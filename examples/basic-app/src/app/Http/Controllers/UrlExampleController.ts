import { Controller } from '@h3ravel/core'
import { Url, createUrlHelpers } from '@h3ravel/url'
import type { HttpContext } from '@h3ravel/shared'

/**
 * Example controller demonstrating URL class usage
 */
export class UrlExampleController extends Controller {
    /**
     * Demonstrate various URL creation methods
     */
    async index(ctx: HttpContext) {
        // Get URL helpers bound to the current app
        const urlHelpers = createUrlHelpers(this.app)
        
        const examples = {
            // Static URL creation
            fromString: Url.of('https://example.com/path?param=value#section').toString(),
            
            // Path-based URL creation
            fromPath: Url.to('/users', this.app).toString(),
            
            // Fluent builder API
            builderChain: Url.of('https://example.com')
                .withScheme('http')
                .withHost('test.com')
                .withPort(8000)
                .withPath('/users')
                .withQuery({ page: 2, limit: 10 })
                .withFragment('section-1')
                .toString(),
            
            // Request-aware helpers
            currentUrl: urlHelpers.url().current(),
            fullUrl: urlHelpers.url().full(),
            previousUrl: urlHelpers.url().previous(),
            queryParams: urlHelpers.url().query(),
            
            // Route-based URLs (demonstrating with existing routes)
            routeUrl: urlHelpers.route('url.examples').toString(),
            
            // Helper functions
            toHelper: urlHelpers.to('/dashboard').toString(),
        }

        return ctx.response.json({
            message: 'URL Examples',
            examples
        })
    }
    app(arg0: string, app: any) {
        throw new Error('Method not implemented.')
    }

    /**
     * Demonstrate URL signing
     */
    async signing(ctx: HttpContext) {
        // Create a URL and sign it
        const url = Url.to('/protected-resource')
        const signedUrl = url.withSignature(this.app)
        
        // Create a temporary signed URL (expires in 5 minutes)
        const tempUrl = Url.to('/temporary-resource')
        const tempSignedUrl = tempUrl.withSignature(this.app, Date.now() + 300000)
        
        return ctx.response.json({
            message: 'URL Signing Examples',
            urls: {
                original: url.toString(),
                signed: signedUrl.toString(),
                temporarySigned: tempSignedUrl.toString(),
                isValid: signedUrl.hasValidSignature(this.app)
            }
        })
    }

    /**
     * Demonstrate URL manipulation
     */
    async manipulation(ctx: HttpContext) {
        const baseUrl = Url.of('https://api.example.com/v1/users')
        
        // Add query parameters
        const withQuery = baseUrl.withQuery({
            page: 1,
            limit: 20,
            sort: 'name',
            filters: ['active', 'verified']
        })
        
        // Modify different parts
        const modified = withQuery
            .withHost('api-v2.example.com')
            .withPath('/v2/users')
            .withQueryParams({ include: 'profile' })
            .withFragment('results')
        
        return ctx.response.json({
            message: 'URL Manipulation Examples',
            urls: {
                base: baseUrl.toString(),
                withQuery: withQuery.toString(),
                modified: modified.toString()
            },
            components: {
                scheme: modified.getScheme(),
                host: modified.getHost(),
                port: modified.getPort(),
                path: modified.getPath(),
                query: modified.getQuery(),
                fragment: modified.getFragment()
            }
        })
    }
}
