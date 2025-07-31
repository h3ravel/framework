import { H3 } from 'h3'
import { Router } from '../Router'
import { ServiceProvider } from '@h3ravel/core'

/**
 * Handles routing registration
 * 
 * Load route files (web.ts, api.ts).
 * Map controllers to routes.
 * Register route-related middleware.
 * 
 * Auto-Registered
 */
export class RouteServiceProvider extends ServiceProvider {
    register () {
        this.app.singleton<Router>('router', () => {
            const h3App = this.app.make<H3>('http.app')
            return new Router(h3App)
        })
    }

    /**
     * Load routes from src/routes
     */
    async boot () {
        try {
            const routesModule = await import(`${process.cwd()}/src/routes/web.ts`)
            if (typeof routesModule.default === 'function') {
                const router = this.app.make<Router>('router')
                routesModule.default(router)
            }
        } catch (e) {
            console.warn('No web routes found or failed to load:', e)
        }
    }
}
