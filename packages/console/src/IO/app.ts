import { Application } from '@h3ravel/core'
import { ConsoleServiceProvider } from '..'
import { glob } from 'node:fs/promises'
import path from 'node:path'
import providers from './providers'

export default class {
    async fire () {

        const app = new Application(process.cwd())

        /**
         * Service providers auto registration
         */
        const providers_path = app_path('Providers/*.js').replace('/src/', '/.h3ravel/serve/')

        /** Add the App Service Providers */
        for await (const provider of glob(providers_path)) {
            const name = path.basename(provider).replace('.js', '')
            try {
                providers.push((await import(provider))[name])
            } catch { /** */ }
        }

        /** Add the ConsoleServiceProvider */
        providers.push(ConsoleServiceProvider)

        /** Register all the Service Providers */
        app.registerProviders(providers)

        await app.registerConfiguredProviders()
        await app.boot()
    }
}
