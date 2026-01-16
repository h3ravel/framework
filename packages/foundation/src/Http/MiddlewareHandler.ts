import { IApplication, IHttpContext, IMiddleware, IMiddlewareHandler } from '@h3ravel/contracts'

import { Arr } from '@h3ravel/support'

/* 
 * Handles registration and execution of middleware.
 * Every middleware implements IMiddleware with a handle(context, next) method.
 */
export class MiddlewareHandler implements IMiddlewareHandler {
    constructor(private middleware: IMiddleware[] = [], private app: IApplication) { }

    /**
     * Registers a middleware instance.
     * 
     * @param mw 
     */
    register (mw: IMiddleware | IMiddleware[]) {
        this.middleware = Array.from(new Set([...this.middleware, ...Arr.wrap(mw)]))

        return this
    }

    /**
     * Runs the middleware chain for a given HttpContext.
     * Each middleware must call next() to continue the chain.
     * 
     * @param context - The current HttpContext.
     * @param next - Callback to execute when middleware completes.
     * @returns A promise resolving to the final handler's result.
     */

    async run (
        context: IHttpContext,
        next: (ctx: IHttpContext) => Promise<any>
    ) {
        let index = -1
        const dispatch = async (i: number): Promise<any> => {

            if (i <= index) throw new Error('Middleware called next() multiple times')

            index = i
            const current = this.middleware[i]

            /**
             * If no more middleware, call the final handler
             */
            if (!current) return next(context)

            /**
             * Execute the current middleware and proceed to the next one
             */
            // const handler = this.app.make(current.handle)
            // console.log(current, )
            return await this.app.invoke(current, 'handle', [context.request, () => dispatch(i + 1)])
            // return current.handle(context.request, () => dispatch(i + 1))
        }

        return dispatch(0)
    }
}