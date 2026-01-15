import { ICallableDispatcher, IControllerDispatcher, IUrlGenerator } from '@h3ravel/contracts'

import { CallableDispatcher } from '../CallableDispatcher'
import { ControllerDispatcher } from '../ControllerDispatcher'
import { ServiceProvider } from '@h3ravel/support'
import { UrlGenerator } from '../UrlGenerator'

export class RoutingServiceProvider extends ServiceProvider {
    public static order = 'before:ConfigServiceProvider'

    async register () {
        this.bindUrlGenerator()

        this.app.singleton(ICallableDispatcher, (app) => {
            return new CallableDispatcher(app)
        })

        this.app.singleton(IControllerDispatcher, (app) => {
            return new ControllerDispatcher(app)
        })
    }

    /**
     * Bind the URL generator service.
     *
     * @return void
     */
    protected bindUrlGenerator () {
        this.app.alias(IUrlGenerator, 'url')
        this.app.singleton('url', (app) => {
            const routes = app.make('router').getRoutes()

            // The URL generator needs the route collection that exists on the router.
            // Keep in mind this is an object, so we're passing by references here
            // and all the registered routes will be available to the generator.
            app.instance('routes', routes)

            return new UrlGenerator(
                routes,
                app.rebinding('http.request', (_app, request) => {
                    this.app.make('url').setRequest(request)
                    return request
                })!,
                app.make('config').get('app.asset_url')
            )
        })

        this.app.extend('url', (url, app) => {
            // Next we will set a few service resolvers on the URL generator so it can
            // get the information it needs to function. This just provides some of
            // the convenience features to this URL generator like "signed" URLs.
            url.setSessionResolver(() => {
                return this.app.make('session') ?? null
            })

            url.setKeyResolver(() => {
                const config = this.app.make('config')

                return [config.get('app.key'), ...(config.get('app.previous_keys') ?? [])]
            })

            // If the route collection is "rebound", for example, when the routes have been
            // cached for the application, we will need to rebind the routes on the
            // URL generator instance so it has the latest version of the routes.
            app.rebinding('routes', (_app, routes) => {
                this.app.make('url').setRoutes(routes)
            })

            return url
        })
    }
}
