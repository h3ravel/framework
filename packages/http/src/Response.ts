import type { DotNestedKeys, DotNestedValue } from '@h3ravel/shared'
import { html, redirect } from 'h3'

import { Application } from '@h3ravel/core'
import type { H3Event } from 'h3'
import { IResponse } from '@h3ravel/shared'
import { safeDot } from '@h3ravel/support'
import { Resource } from './Resource'
import { Collection } from './Collection'

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
    setStatusCode(code: number): this {
        this.statusCode = code
        this.event.res.status = code
        return this
    }

    /**
     * Set a header.
     */
    setHeader(name: string, value: string): this {
        this.headers[name] = value
        return this
    }

    /**
     * Send HTML response
     */
    html(content: string): string {
        this.applyHeaders()
        return html(this.event, content)
    }

    /**
     * Send JSON response.
     * Detects Resource and Collection instances automatically.
     */
    json<T = unknown>(data: T): any {
        this.setHeader('content-type', 'application/json; charset=utf-8')
        this.applyHeaders()

        // Auto-detect Resource/Collection
        let payload: any = data

        if (data instanceof Resource) {
            payload = { data: data.toArray() }
        } else if (data instanceof Collection) {
            payload = data.json().body
        }

        return payload
    }

    /**
     * Send plain text response
     */
    text(data: string): string {
        this.setHeader('content-type', 'text/plain; charset=utf-8')
        this.applyHeaders()
        return data
    }

    /**
     * Redirect to another URL
     */
    redirect(url: string, status = 302): string {
        this.setStatusCode(status)
        return redirect(this.event, url, this.statusCode)
    }

    /**
     * Apply headers before sending response.
     */
    private applyHeaders(): void {
        Object.entries(this.headers).forEach(([key, value]) => {
            this.event.res.headers.set(key, value)
        })
    }

    /**
     * Get the base event
     */
    getEvent(): H3Event
    getEvent<K extends DotNestedKeys<H3Event>>(key: K): DotNestedValue<H3Event, K>
    getEvent<K extends DotNestedKeys<H3Event>>(key?: K): any {
        return safeDot(this.event, key)
    }
}
