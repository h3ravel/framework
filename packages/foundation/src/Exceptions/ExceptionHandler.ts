import { Handler } from './Handler'
import { HttpContext } from '@h3ravel/shared'
import { HttpException } from './HttpException'
import { RequestException } from '../Http/RequestException'

export class ExceptionHandler extends Handler {
    public async handle (error: Error, ctx: HttpContext) {
        const e = this.mapException(error)

        try {
            /**
             * Skip reporting if in dontReport list
             */
            if (!this.dontReportList.some((t) => error instanceof t)) {
                for (const cb of this.reportCallbacks) {
                    await cb(error)
                }
            }

            /**
             * Try custom render callbacks
             */
            for (const cb of this.renderCallbacks) {
                const response = await cb(error, ctx)
                if (response) return response
            }

            /**
             * Default response fallback
             */
            if (error instanceof RequestException) {
                const status = (error.status ?? 500)
                error = HttpException.fromStatusCode(status, error.message || 'Server Error', error)
            }

            return this.render(ctx, error)
        } catch (handlingError) {
            /**
             * Fallback for catastrophic errors during handling
             */
            return ctx.response
                .setStatusCode(500)
                .setContent(ctx.request.expectsJson() ? {
                    message: 'Fatal error while handling exception',
                    error: (handlingError as any).stack,
                } : 'Fatal error while handling exception')
                .sendContent(ctx.request.expectsJson() ? 'json' : 'html')
        }
    }
}