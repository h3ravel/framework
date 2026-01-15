import { dbBuilder, fileBuilder, memoryBuilder, redisBuilder } from '../adapters'

import { MakeSessionTableCommand } from '../Commands/MakeSessionTableCommand'
import { ServiceProvider } from '@h3ravel/support'
import { SessionManager } from '../SessionManager'
import { SessionStore } from '../SessionStore'

export class SessionServiceProvider extends ServiceProvider {
    public static priority = 895
    public static order = 'before:HttpServiceProvider'

    register (): void {
        /**
         * Register default drivers.
         */
        SessionStore.register('file', fileBuilder)
        SessionStore.register('database', dbBuilder)
        SessionStore.register('memory', memoryBuilder)
        SessionStore.register('redis', redisBuilder)

        this.app.singleton('session', (app) => {
            return SessionManager.init(app)
        })

        this.app.singleton('session.store', (app) => {
            // First, we will create the session manager which is responsible for the
            // creation of the various session drivers when they are needed by the
            // application instance, and will resolve them on a lazy load basis.
            return app.make('session').getDriver()
        })

        this.registerCommands([MakeSessionTableCommand])
    }
}
