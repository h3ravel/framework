import { HttpContext, IMiddleware } from '@h3ravel/shared'

import { Arr } from '@h3ravel/support'

/* 
 * Handles registration and execution of middleware.
 * Every middleware implements IMiddleware with a handle(context, next) method.
 */
export class MiddlewareHandler {
    constructor(private middleware: IMiddleware[] = []) { }

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
        context: HttpContext,
        next: (ctx: HttpContext) => Promise<any>
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
            return current.handle(context, () => dispatch(i + 1))
        }

        return dispatch(0)
    }
}