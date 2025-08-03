import { DotNestedKeys, DotNestedValue, safeDot } from '@h3ravel/support'
import { html, redirect, } from 'h3'

import type { H3Event } from 'h3'
import { IResponse } from '@h3ravel/shared'

export class Response implements IResponse {
    private readonly event: H3Event
    private statusCode: number = 200
    private headers: Record<string, string> = {}

    constructor(event: H3Event) {
        this.event = event
    }

    /**
     * Set HTTP status code.
     */
    setStatusCode (code: number): this {
        this.statusCode = code
        this.event.res.status = code
        return this
    }

    /**
     * Set a header.
     */
    setHeader (name: string, value: string): this {
        this.headers[name] = value
        return this
    }

    html (content: string): string {
        this.applyHeaders()
        return html(this.event, content)
    }

    /**
     * Send a JSON response.
     */
    json<T = unknown> (data: T): T {
        this.setHeader('content-type', 'application/json; charset=utf-8')
        this.applyHeaders()
        return data
    }

    /**
     * Send plain text.
     */
    text (data: string): string {
        this.setHeader('content-type', 'text/plain; charset=utf-8')
        this.applyHeaders()
        return data
    }

    /**
     * Redirect to another URL.
     */
    redirect (url: string, status = 302): string {
        this.setStatusCode(status)
        return redirect(this.event, url, this.statusCode)
    }

    /**
     * Apply headers before sending response.
     */
    private applyHeaders (): void {
        Object.entries(this.headers).forEach(([key, value]) => {
            this.event.res.headers.set(key, value)
        })
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
