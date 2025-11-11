import { UnprocessableEntityHttpException } from '@h3ravel/foundation'
import { h3ravel } from '@h3ravel/core'
import providers from 'src/bootstrap/providers'

export default class {
    async bootstrap () {
        const app = await h3ravel(providers, process.cwd(), { autoload: true, initialize: false }, async () => undefined)

        app.configure()
            .withExceptions((exceptions) => {
                return exceptions
                    /**
                     * Register global reporters here
                     */
                    .report((error) => {
                        console.error('Unhandled Exception:', error)
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
