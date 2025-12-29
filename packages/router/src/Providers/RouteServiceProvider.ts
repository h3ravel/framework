import { IRouter } from '@h3ravel/contracts'
import { Logger } from '@h3ravel/shared'
import { RouteListCommand } from '../Commands/RouteListCommand'
import { Router } from '../Router'
import { ServiceProvider } from '@h3ravel/core'
import { SubstituteBindings } from '../Middleware/SubstituteBindings'
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
        this.app.bindMiddleware('SubstituteBindings', SubstituteBindings)

        this.booted(() => {
            const router = this.app.make(IRouter)
            if (typeof router.getRoutes === 'function') {
                router.getRoutes().refreshActionLookups()
                router.getRoutes().refreshNameLookups()
            }
        })

        const router = () => {
            try {
                const h3App = this.app.make('http.app')

                return new Router(h3App, this.app as never)
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
        }

        this.app.singleton('router', router)
        this.app.alias(Router, 'router')
        this.app.alias(IRouter, 'router')

        this.registerCommands([RouteListCommand])
    }

    /**
     * Load routes from src/routes
     */
    async boot () {
        await this.loadRoutes()
    }

    /**
     * Load the application routes.
     */
    protected async loadRoutes () {
        try {
            const routePath = this.app.getPath('routes')

            const files = (await readdir(routePath)).filter((e) => {
                return !e.includes('.d.') && !e.includes('.map')
            })

            for (const file of files) {
                const { default: route } = await import(path.join(routePath, file))

                if (typeof route === 'function') {
                    const router = this.app.make('router')
                    route(router)
                }
            }
        } catch (e: any) {
            if (!this.app.runningUnitTests()) {
                Logger.log([['No auto discorvered routes.', 'white'], [e.message, ['grey', 'italic']]], '\n')
            }
        }
    }
}
