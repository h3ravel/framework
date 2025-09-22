import { Router } from '../Route'
import { ServiceProvider } from '@h3ravel/core'
import path from 'node:path'
import { readdir } from 'node:fs/promises'

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
    public static priority = 997;

    register () {
        this.app.singleton('router', () => {
            const h3App = this.app.make('http.app')
            return new Router(h3App, this.app)
        })
    }

    /**
     * Load routes from src/routes
     */
    async boot () {
        try {
            const routePath = this.app.getPath('routes')

            const files = (await readdir(routePath)).filter((e) => {
                return !e.includes('.d.ts') && !e.includes('.d.cts') && !e.includes('.map')
            })

            for (let i = 0; i < files.length; i++) {
                const routesModule = await import(path.join(routePath, files[i]))

                if (typeof routesModule.default === 'function') {
                    const router = this.app.make('router')
                    routesModule.default(router)
                }
            }
        } catch (e) {
            console.warn('No web routes found or failed to load:', e)
        }
    }
}
