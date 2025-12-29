/// <reference path="../app.globals.d.ts" />
import { ServiceProvider } from '@h3ravel/foundation'
import { Url } from '../Url'
import { createUrlHelper } from '../RequestAwareHelpers'
import { createUrlHelpers } from '../Helpers'

/**
 * Service provider for URL utilities
 */
export class UrlServiceProvider extends ServiceProvider {
    public static priority = 897

    /**
     * Register URL services in the container
     */
    register (): void {
        this.app.setUriResolver(() => Url)
    }

    /**
     * Boot URL services
     */
    boot (): void {
        // Register the Url class
        this.app.singleton('app.url', () => Url)
        // Register the url() helper function
        this.app.singleton('app.url.helper', () => createUrlHelper(this.app))

        // Register bound URL helpers
        this.app.singleton('app.url.helpers', () => createUrlHelpers(this.app))

        if (typeof globalThis !== 'undefined') {
            const helpers = createUrlHelpers(this.app)

            Object.assign(globalThis, {
                url: helpers.url,
                route: helpers.route,
                action: helpers.action,
            })
        }
    }
}
