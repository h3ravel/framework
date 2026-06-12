import { Application, h3ravel } from '@h3ravel/core'

import { importFile } from '@h3ravel/shared'
import { UnprocessableEntityHttpException } from '../Exceptions/UnprocessableEntityHttpException'
import path from 'node:path'

export class TestApplication {
    /**
     * Initialize the app without firing up the dev server
     * 
     * @returns 
     */
    async init (cwd?: string) {
        const basePath = cwd ?? process.cwd()
        const providersModule = await importFile<{ default?: unknown }>(
            path.join(basePath, 'src/bootstrap/providers.ts'),
        )
        const providers = providersModule.default ?? providersModule

        if (!Array.isArray(providers)) {
            throw new TypeError('The application providers module must export an array as its default export.')
        }

        const app = await h3ravel(providers, basePath, { autoload: true, initialize: false })
        this.configure(app, basePath)
        return await app.boot()
    }

    configure (app: Application, basePath = process.cwd()) {
        return app.configure()
            .withRouting({
                web: path.join(basePath, 'src/routes/web.ts'),
                api: path.join(basePath, 'src/routes/api.ts'),
            })
            .withExceptions((exceptions) => {
                return exceptions
                    /**
                     * Register global reporters here
                     */
                    .report((error) => {
                        void error
                    })
                    /**
                     * Prevent some exceptions from being reported
                     */
                    .dontReport([
                        UnprocessableEntityHttpException,
                    ])
                    /**
                     * Configure request exception message truncation
                     */
                    .truncateRequestExceptionsAt(200)
            })
            .withMiddleware(() => { })
    }
}
