import { IApplication, IRouter } from '@h3ravel/contracts'
import { Injectable, ModelNotFoundException } from '@h3ravel/foundation'
import { Middleware, Request } from '@h3ravel/http'

@Injectable()
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
    @Injectable()
    async handle (request: Request, next: (request: Request) => Promise<unknown>) {

        const route = request.route()

        try {
            await this.router.substituteBindings(route)
            await this.router.substituteImplicitBindings(route)
        } catch (e) {
            if (e instanceof ModelNotFoundException) {
                const getMissing = route.getMissing()
                if (typeof getMissing !== 'undefined') {
                    return getMissing(request, e)
                }
            }

            throw e
        }

        return next(request)
    }
}
