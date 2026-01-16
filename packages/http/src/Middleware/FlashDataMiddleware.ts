import { Injectable } from '@h3ravel/foundation'
import { Middleware } from '../Middleware'
import { Request } from '..'

export class FlashDataMiddleware extends Middleware {
    @Injectable()
    async handle (request: Request, next: (request: Request) => Promise<unknown>): Promise<unknown> {
        const _next = await next(request)

        request.session().ageFlashData()

        return _next
    }
}
