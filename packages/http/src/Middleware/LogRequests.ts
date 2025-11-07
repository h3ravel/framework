import { HttpContext } from '../HttpContext'
import { Logger } from '@h3ravel/shared'
import { Middleware } from '../Middleware'

export class LogRequests extends Middleware {
    async handle ({ request }: HttpContext, next: () => Promise<unknown>): Promise<unknown> {
        Logger.log([[` ${request.method()} `, 'bgBlue'], [request.fullUrl(), 'white']], ' ')
        return next()
    }
}
