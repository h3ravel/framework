import { Logger } from '@h3ravel/shared'
import { RouteListCommand } from '../Commands/RouteListCommand'
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
    public static priority = 997

    register () {
        this.app.singleton('router', () => {
            try {
                const h3App = this.app.make('http.app')

                return new Router(h3App, this.app)
            } catch (error: any) {
                if (String(error.message).includes('http.app'))
                    Logger.log([
                        ['The', 'white'],
                        ['@h3ravel/http', ['italic', 'gray']],
                        ['package is required to use the routing system.', 'white']
                    ], ' ')
                else Logger.log(error, 'white')
            }
            return {} as Router
        })

        this.registerCommands([RouteListCommand])
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
        } catch (e: any) {
            Logger.log([['No auto discorvered routes.', 'white'], [e.message, ['grey', 'italic']]], '\n')
        }
    }
}
