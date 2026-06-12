import { ConcreteConstructor, IApplication } from '@h3ravel/contracts'

import { Application } from '@h3ravel/core'
import { ServiceProvider } from '@h3ravel/support'
import { importFile } from '@h3ravel/shared'
import path from 'node:path'

type AServiceProvider = (new (_app: Application) => ServiceProvider) & Partial<ServiceProvider>

export default class Console {
    async app () {
        const production = process.env.NODE_ENV === 'production'
        const sourceDir = production ? process.env.DIST_DIR ?? '.h3ravel/serve' : 'src'
        const extension = production ? 'js' : 'ts'
        const providers: ConcreteConstructor<AServiceProvider>[] = []
        const app = new Application(process.cwd(), 'Console')

        /**
         * Load Service Providers already registered by the app
         */
        const app_providers = path.join(process.cwd(), sourceDir, `bootstrap/providers.${extension}`)
        try {
            const module = await importFile<{ default?: ConcreteConstructor<AServiceProvider>[] }>(app_providers)
            providers.push(...module.default ?? [])
        } catch { /** */ }

        /**
         * Iniitilize the app
         */
        const bootstrapFile = path.join(process.cwd(), sourceDir, `bootstrap/app.${extension}`)
        const { default: bootstrap } = await importFile<{
            default: new () => { configure: (app: Application) => unknown }
        }>(bootstrapFile)
        new bootstrap().configure(app)

        /** Register all the Service Providers */
        app.initialize(providers, ['CoreServiceProvider'])
            .logging(false)
            .singleton(IApplication, () => app)
        await app.handleCommand()
    }
}
