import { IApplication, type HttpContext as IHttpContext, IRequest, IResponse } from '@h3ravel/shared'
import type { H3Event } from 'h3'

/**
 * Represents the HTTP context for a single request lifecycle.
 * Encapsulates the application instance, request, and response objects.
 */
export class HttpContext implements IHttpContext {
    private static contexts = new WeakMap<any, HttpContext>()
    public event!: H3Event

    constructor(
        public app: IApplication,
        public request: IRequest,
        public response: IResponse
    ) { }

    /**
     * Factory method to create a new HttpContext instance from a context object.
     * @param ctx - Object containing app, request, and response
     * @returns A new HttpContext instance
     */
    static init (ctx: { app: IApplication; request: IRequest; response: IResponse }, event?: H3Event): HttpContext {
        if (!!event && HttpContext.contexts.has(event)) {
            return HttpContext.contexts.get(event)!
        }

        const instance = new HttpContext(ctx.app, ctx.request, ctx.response)
        instance.event = event!
        ctx.request.context = instance
        ctx.response.context = instance

        if (event) {
            HttpContext.contexts.set(event, instance)
        }

        return instance
    }

    /**
     * Retrieve an existing HttpContext instance for an event, if any.
     */
    static get (event: unknown): HttpContext | undefined {
        return HttpContext.contexts.get(event)
    }

    /**
     * Delete the cached context for a given event (optional cleanup).
     */
    static forget (event: unknown): void {
        HttpContext.contexts.delete(event)
    }
}