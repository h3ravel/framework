import { HttpContext, Middleware } from '@h3ravel/http'

export class LogRequests extends Middleware {
    async handle ({ request }: HttpContext, next: () => Promise<unknown>): Promise<unknown> {
        const url = request.getEvent('url')
        console.log(`[${request.getEvent('method')}] ${url.pathname + url.search}`)
        return next()
    }
}
