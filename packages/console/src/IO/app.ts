import { Application, ServiceProvider } from '@h3ravel/core'

import { ConsoleServiceProvider } from '..'
import path from 'node:path'

type AServiceProvider = (new (_app: Application) => ServiceProvider) & Partial<ServiceProvider>

export default class {
    async fire () {

        const DIST_DIR = process.env.DIST_DIR ?? '/.h3ravel/serve/'
        const providers: AServiceProvider[] = []
        const app = new Application(process.cwd())

        /**
         * Load Service Providers already registered by the app
         */
        const app_providers = base_path(path.join(DIST_DIR, 'bootstrap/providers.js'))
        try {
            providers.push(...(await import(app_providers)).default)
        } catch { /** */ }

        /** Add the ConsoleServiceProvider */
        providers.push(ConsoleServiceProvider)

        /** Register all the Service Providers */
        await app.quickStartup(providers, ['CoreServiceProvider'])
    }
}
