import type { DotNestedKeys, DotNestedValue } from '@h3ravel/shared'
import type { H3Event, HTTPResponse } from 'h3'
import { html, redirect, } from 'h3'

import { Application } from '@h3ravel/core'
import { IResponse } from '@h3ravel/shared'
import { safeDot } from '@h3ravel/support'

export class Response implements IResponse {
    /**
     * The current H3 H3Event instance
     */
    private readonly event: H3Event

    private statusCode: number = 200
    private headers: Record<string, string> = {}

    constructor(
        event: H3Event,
        /**
         * The current app instance
         */
        public app: Application
    ) {
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

    html (content: string): HTTPResponse {
        this.applyHeaders()
        return html(content)
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
    redirect (location: string, status: number = 302, statusText?: string | undefined): HTTPResponse {
        this.setStatusCode(status)
        return redirect(location, this.statusCode, statusText)
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
