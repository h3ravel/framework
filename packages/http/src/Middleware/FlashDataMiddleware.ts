import { HttpContext } from '../HttpContext'
import { Middleware } from '../Middleware'

export class FlashDataMiddleware extends Middleware {
    async handle ({ request }: HttpContext, next: () => Promise<unknown>): Promise<unknown> {

        const _next = await next()

        request.session().ageFlashData()

        return _next
    }
}
