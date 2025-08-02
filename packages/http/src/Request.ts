import { getQuery, getRouterParams, type H3Event } from 'h3'
import { DotNestedKeys, DotNestedValue, safeDot } from '@h3ravel/support'

export class Request {
    private readonly event: H3Event

    constructor(event: H3Event) {
        this.event = event
    }

    /**
     * Get all input data (query + body).
     */
    async all<T = Record<string, unknown>> (): Promise<T> {
        return {
            ...getRouterParams(this.event),
            ...getQuery(this.event),
            ...this.event.req.body
        } as T
    }

    /**
     * Get a single input field from query or body.
     */
    async input<T = unknown> (key: string, defaultValue?: T): Promise<T> {
        const data = await this.all<Record<string, T>>()
        return (data[key] ?? defaultValue) as T
    }

    /**
     * Get route parameters.
     */
    params<T = Record<string, string>> (): T {
        return getRouterParams(this.event) as T
    }

    /**
     * Get query parameters.
     */
    query<T = Record<string, string>> (): T {
        return getQuery(this.event) as T
    }

    /**
     * Get the base event
     */
    getEvent (): H3Event
    getEvent<K extends DotNestedKeys<H3Event>> (key: K): DotNestedValue<H3Event, K>
    getEvent<K extends DotNestedKeys<H3Event>> (key?: K): any {
        return safeDot(this.event, key)
    }
}
