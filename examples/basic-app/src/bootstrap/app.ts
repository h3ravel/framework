import { HttpException, UnprocessableEntityHttpException } from '@h3ravel/foundation'

import { HttpContext } from '@h3ravel/shared'
import { ValidationException } from '@h3ravel/validation'
import { h3ravel } from '@h3ravel/core'
import providers from 'src/bootstrap/providers'

export default class {
    async bootstrap () {
        const app = await h3ravel(providers, process.cwd(), { autoload: true, initialize: false }, async () => undefined)

        app
            .configure()
            .withExceptions((exceptions) => {
                return exceptions
                    .render((error, { request, response }: HttpContext) => {
                    })
                    /**
                     * Register global reporters
                     */
                    .report((error) => {
                        console.error('🔥 Unhandled Exception:')
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

        return await app.fire()
    }
}
