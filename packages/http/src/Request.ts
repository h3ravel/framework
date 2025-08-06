import { getQuery, getRouterParams, readBody, type H3Event } from 'h3'
import { DotNestedKeys, DotNestedValue, safeDot } from '@h3ravel/support'
import type { ResponseHeaderMap, TypedHeaders } from 'fetchdts'
import { IApplication, IRequest } from '@h3ravel/shared'

export class Request implements IRequest {
    /**
     * Gets route parameters.
     * @returns An object containing route parameters.
     */
    readonly params: NonNullable<H3Event["context"]["params"]>

    /**
     * Gets query parameters.
     * @returns An object containing query parameters.
     */
    readonly query: Record<string, string>;

    /**
     * Gets the request headers.
     * @returns An object containing request headers.
     */
    readonly headers: TypedHeaders<Record<keyof ResponseHeaderMap, string>>

    /**
     * The current H3 H3Event instance
     */
    private readonly event: H3Event

    constructor(
        event: H3Event,
        /**
         * The current app instance
         */
        public app: IApplication
    ) {
        this.event = event
        this.query = getQuery(this.event)
        this.params = getRouterParams(this.event)
        this.headers = this.event.req.headers
    }

    /**
     * Get all input data (query + body).
     */
    async all<T = Record<string, unknown>> (): Promise<T> {
        let data = {
            ...getRouterParams(this.event),
            ...getQuery(this.event),
        } as T

        if (this.event.req.method === 'POST') {
            data = Object.assign({}, data, Object.fromEntries((await this.event.req.formData()).entries()))
        } else if (this.event.req.method === 'PUT') {
            data = <never>Object.fromEntries(Object.entries(<never>await readBody(this.event)))
        }

        return data
    }

    /**
     * Get a single input field from query or body.
     */
    async input<T = unknown> (key: string, defaultValue?: T): Promise<T> {
        const data = await this.all<Record<string, T>>()
        return (data[key] ?? defaultValue) as T
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
