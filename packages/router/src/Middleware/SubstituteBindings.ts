import { IApplication, IRouter } from '@h3ravel/contracts'
import { Middleware, Request } from '@h3ravel/http'

export class SubstituteBindings extends Middleware {
    /**
     * 
     * @param router The router instance.
     */
    constructor(protected app: IApplication, protected router: IRouter) {
        super(app)
    }

    /**
     * Handle an incoming request.
     *
     * @param  request
     * @param  next
     */
    async handle (request: Request, next: (request: Request) => Promise<unknown>) {

        const route = request.route()
        console.log(route, '----')
        try {
            this.router.substituteBindings(route)
            this.router.substituteImplicitBindings(route)
        } catch (e) {
            const { ModelNotFoundException } = await import('@h3ravel/database')

            if (e instanceof ModelNotFoundException) {
                const getMissing = route.getMissing()
                if (typeof getMissing !== 'undefined') {
                    return getMissing(request, e)
                }

                throw e
            }
        }

        return next(request)
    }
}
