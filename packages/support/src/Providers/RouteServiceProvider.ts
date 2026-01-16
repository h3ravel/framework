import { CallableConstructor, IRouter } from '@h3ravel/contracts'

import { Logger } from '@h3ravel/shared'
import { ServiceProvider } from '../Providers/ServiceProvider'

/**
 * Handles routing registration
 * 
 * Load route files (web.ts, api.ts).
 * Map controllers to routes.
 * Register route-related middleware.
 */
export class RouteServiceProvider extends ServiceProvider {
    public static priority = 997

    /**
     * The callback that should be used to load the application's routes.
     */
    protected loadRoutesUsing?: CallableConstructor

    /**
     * The global callback that should be used to load the application's routes.
     */
    protected static alwaysLoadRoutesUsing?: CallableConstructor

    async register () {
        const { RouteListCommand, Router, SubstituteBindings } = await import('@h3ravel/router')

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
            return {} as InstanceType<typeof Router>
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
     * Register the callback that will be used to load the application's routes.
     *
     * @param  routesCallback
     */
    protected routes (routesCallback: CallableConstructor) {
        this.loadRoutesUsing = routesCallback
        return this
    }

    /**
     * Register the callback that will be used to load the application's routes.
     *
     * @param  routesCallback
     */
    public static loadRoutesUsing (routesCallback?: CallableConstructor) {
        this.alwaysLoadRoutesUsing = routesCallback
    }

    /**
     * Load the application routes.
     */
    protected async loadRoutes () {
        if (RouteServiceProvider.alwaysLoadRoutesUsing != null) {
            this.app.call(RouteServiceProvider.alwaysLoadRoutesUsing)
        }

        if (this.loadRoutesUsing != null) {
            this.app.call(this.loadRoutesUsing)
        } else if (typeof (this as any)['map'] === 'function') {
            this.app.call((this as any)['map'])
        }
        // try {
        //     const routePath = this.app.getPath('routes')

        //     const files = (await readdir(routePath)).filter((e) => {
        //         return !e.includes('.d.') && !e.includes('.map')
        //     })

        //     for (const file of files) {
        //         const { default: route } = await import(path.join(routePath, file))

        //         if (typeof route === 'function') {
        //             const router = this.app.make('router')
        //             route(router)
        //         }
        //     }
        // } catch (e: any) {
        //     if (!this.app.runningUnitTests()) {
        //         Logger.log([['Route autoloading error', 'white'], [e.message, ['grey', 'italic']]], ': ')
        //     }
        // }
    }
}
