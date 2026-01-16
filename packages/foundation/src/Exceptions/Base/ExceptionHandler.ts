import { Handler } from './Handler'
import { HttpException } from './HttpException'
import { IHttpContext } from '@h3ravel/contracts'
import { RequestException } from './RequestException'

export class ExceptionHandler extends Handler {
    public async handle (error: Error, ctx: IHttpContext) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
                const response = await cb(error, ctx.request)
                if (response) return response
            }

            /**
             * Default response fallback
             */
            if (error instanceof RequestException) {
                const status = (error.status ?? 500)
                error = HttpException.fromStatusCode(status, error.message || 'Server Error', error)
            }

            return this.render(ctx.request, error)
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