import { ConcreteConstructor, IApplication } from '@h3ravel/contracts'

import { Application } from '@h3ravel/core'
import { ServiceProvider } from '@h3ravel/support'
import path from 'node:path'

type AServiceProvider = (new (_app: Application) => ServiceProvider) & Partial<ServiceProvider>

export default class Console {
    async app () {
        const DIST_DIR = process.env.DIST_DIR ?? '/.h3ravel/serve/'
        const providers: ConcreteConstructor<AServiceProvider>[] = []
        const app = new Application(process.cwd(), 'Console')

        /**
         * Load Service Providers already registered by the app
         */
        const app_providers = base_path(path.join(DIST_DIR, 'bootstrap/providers.js'))
        try {
            providers.push(...(await import(app_providers)).default)
        } catch { /** */ }

        /**
         * Iniitilize the app
         */
        const bootstrapFile = base_path(path.join(DIST_DIR, 'bootstrap/app.js'))
        const { default: bootstrap } = await import(bootstrapFile)
        new bootstrap().configure(app)

        /** Register all the Service Providers */
        app.initialize(providers, ['CoreServiceProvider'])
            .logging(false)
            .singleton(IApplication, () => app)
        await app.handleCommand()
    }
}
