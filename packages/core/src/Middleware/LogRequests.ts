import type { H3Event } from 'h3'
import { Middleware } from '@h3ravel/core'

export class LogRequests extends Middleware {
    async handle (event: H3Event, next: () => Promise<unknown>): Promise<unknown> {
        console.log(`[${event.req.method}] ${event.url.pathname + event.url.search}`)
        return next()
    }
}
