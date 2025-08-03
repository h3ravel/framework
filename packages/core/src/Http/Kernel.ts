import { HttpContext, IMiddleware } from '@h3ravel/shared'

import type { H3Event } from 'h3'

export class Kernel {
    constructor(
        protected context: (event: H3Event) => HttpContext,
        protected middleware: IMiddleware[] = [],
    ) { }

    async handle (event: H3Event, next: (ctx: HttpContext) => Promise<unknown>): Promise<unknown> {
        const ctx = this.context(event)
        const result = await this.runMiddleware(ctx, () => next(ctx))

        // Auto-set JSON header if plain object returned
        if (result !== undefined && this.isPlainObject(result)) {
            event.res.headers.set('Content-Type', 'application/json; charset=UTF-8')
        }

        return result
    }

    private async runMiddleware (context: HttpContext, next: (ctx: HttpContext) => Promise<unknown>) {
        let index = -1

        const runner = async (i: number): Promise<unknown> => {
            if (i <= index) throw new Error('next() called multiple times')
            index = i
            const middleware = this.middleware[i]

            if (middleware) {
                return middleware.handle(context, () => runner(i + 1))
            } else {
                return next(context)
            }
        }

        return runner(0)
    }

    private isPlainObject (value: unknown): value is Record<string, unknown> {
        return typeof value === 'object' &&
            value !== null &&
            (value.constructor === Object || value.constructor === Array)
    }
}
