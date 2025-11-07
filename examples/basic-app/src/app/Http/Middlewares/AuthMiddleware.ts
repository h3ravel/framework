import { HttpContext, Middleware } from '@h3ravel/http'

export class AuthMiddleware extends Middleware {
    async handle ({ request }: HttpContext, next: () => Promise<unknown>): Promise<unknown> {
        console.log('app/Http/Middleware/AuthMiddleware', request.method())
        return next()
    }
}
