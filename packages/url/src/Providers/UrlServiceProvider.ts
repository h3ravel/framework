import { ServiceProvider } from '@h3ravel/core'
import { Url } from '../Url'
import { createUrlHelper } from '../RequestAwareHelpers'
import { createUrlHelpers } from '../Helpers'

/**
 * Service provider for URL utilities
 */
export class UrlServiceProvider extends ServiceProvider {
    /**
     * Register URL services in the container
     */
    register(): void {
        // Register the Url class
        this.app.singleton(<never>'url.class', () => Url)
        
        // Register the url() helper function
        this.app.singleton(<never>'url.helper', () => createUrlHelper(this.app))
        
        // Register bound URL helpers
        this.app.singleton(<never>'url.helpers', () => createUrlHelpers(this.app))
        
        // Make url() globally available
        if (typeof globalThis !== 'undefined') {
            const helpers = createUrlHelpers(this.app);
            (globalThis as any).url = helpers.url;
            (globalThis as any).route = helpers.route;
            (globalThis as any).action = helpers.action;
            (globalThis as any).to = helpers.to;
            (globalThis as any).signedRoute = helpers.signedRoute;
            (globalThis as any).temporarySignedRoute = helpers.temporarySignedRoute;
        }
    }

    /**
     * Boot URL services
     */
    boot(): void {
        // Any additional setup can be done here
    }
}
