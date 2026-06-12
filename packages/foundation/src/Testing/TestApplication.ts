import { Application, h3ravel } from '@h3ravel/core'

import { UnprocessableEntityHttpException } from '../Exceptions/UnprocessableEntityHttpException'
import path from 'node:path'

export class TestApplication {
    /**
     * Initialize the app without firing up the dev server
     * 
     * @returns 
     */
    async init (cwd?: string) {
        const providers = await import(path.join(cwd ?? process.cwd(), 'src/bootstrap/providers'))
        const app = await h3ravel(providers, process.cwd(), { autoload: true, initialize: false })
        this.configure(app)
        return await app.boot()
    }

    configure (app: Application) {
        return app.configure()
            .withRouting({
                web: path.join(process.cwd(), 'src/routes/web.ts'),
                api: path.join(process.cwd(), 'src/routes/api.ts'),
                // commands: path.join(process.cwd(), 'src/routes/console.ts'),
                // channels: path.join(process.cwd(), 'src/routes/channels.ts'),
                // health: '/up',
            })
            .withExceptions((exceptions) => {
                return exceptions
                    /**
                     * Register global reporters here
                     */
                    .report((_error) => {
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
