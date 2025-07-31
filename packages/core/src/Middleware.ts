import type { H3Event } from 'h3'

export abstract class Middleware {
    abstract handle (event: H3Event, next: () => Promise<unknown>): Promise<unknown>
}
