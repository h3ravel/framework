import type { DotNestedKeys, DotNestedValue } from '@h3ravel/shared'
import { type H3Event, HTTPResponse } from 'h3'
import { redirect, } from 'h3'

import { Application } from '@h3ravel/core'
import { HttpResponse } from './Utilities/HttpResponse'
import { IResponse } from '@h3ravel/shared'
import { safeDot } from '@h3ravel/support'

export class Response extends HttpResponse implements IResponse {
    constructor(
        /**
         * The current H3 H3Event instance
         */
        event: H3Event,
        /**
         * The current app instance
         */
        public app: Application
    ) {
        super(event)
        globalThis.response = () => this
    }

    /**
     * Sends content for the current web response.
     */
    public sendContent (type?: 'html' | 'json' | 'text' | 'xml', parse?: boolean) {
        if (!type) {
            return this.text(this.content, parse!)
        }

        return this[type].call(this, this.content, parse!)
    }

    /**
     * Sends content for the current web response.
     */
    public send (type?: 'html' | 'json' | 'text' | 'xml') {
        return this.sendContent(type, true)
    }

    /**
     * Use an edge view as content
     * 
     * @param viewPath The path to the view file
     * @param send if set to true, the content will be returned, instead of the Response instance
     * @returns 
     */
    async view (viewPath: string, data?: Record<string, any> | undefined): Promise<this>
    async view (viewPath: string, data: Record<string, any> | undefined, parse: boolean): Promise<HTTPResponse>
    async view (viewPath: string, data?: Record<string, any> | undefined, parse?: boolean): Promise<HTTPResponse | this> {
        return this.html(await this.app.make('edge').render(viewPath, data), parse!) as never
    }

    /**
     * 
     * Parse content as edge view
     * 
     * @param content The content to serve
     * @param send if set to true, the content will be returned, instead of the Response instance
     * @returns 
     */
    async viewTemplate (content: string, data?: Record<string, any> | undefined): Promise<this>
    async viewTemplate (content: string, data: Record<string, any> | undefined, parse: boolean): Promise<HTTPResponse>
    async viewTemplate (content: string, data?: Record<string, any> | undefined, parse?: boolean): Promise<HTTPResponse | this> {
        return this.html(await this.app.make('edge').renderRaw(content, data), parse!) as never
    }

    /**
     * 
     * @param content The content to serve
     * @param send if set to true, the content will be returned, instead of the Response instance
     * @returns 
     */
    html (content?: string): this
    html (content: string, parse: boolean): HTTPResponse
    html (content?: string, parse?: boolean): HTTPResponse | this {
        return this.httpResponse('text/html', content ?? this.content, parse!) as never
    }

    /**
     * Send a JSON response.
     */
    json<T = unknown> (data?: T): this
    json<T = unknown> (data: T, parse: boolean): T
    json<T = unknown> (data?: T, parse?: boolean): HTTPResponse | this {
        const content = data ?? this.content
        return this.httpResponse(
            'application/json',
            typeof content !== 'string' ? JSON.stringify(content) : content,
            parse!
        ) as never
    }

    /**
     * Send plain text.
     */
    text (content?: string): this
    text (content: string, parse: boolean): HTTPResponse
    text (content?: string, parse?: boolean): HTTPResponse | this {
        return this.httpResponse('text/plain', content ?? this.content, parse!) as never
    }

    /**
     * Send plain xml.
     */
    xml (data?: string): this
    xml (data: string, parse: boolean): HTTPResponse
    xml (data?: string, parse?: boolean) {
        return this.httpResponse('application/xml', data ?? this.content, parse!) as never
    }

    /**
     * Build the HTTP Response
     * 
     * @param contentType 
     * @param data 
     */
    private httpResponse (contentType: string, data?: string): this
    private httpResponse (contentType: string, data: string, parse: boolean): HTTPResponse
    private httpResponse (contentType: string, data?: string, parse?: boolean) {
        if (parse) {
            this.sendHeaders()
            return new HTTPResponse(
                data ?? this.content, {
                status: this.statusCode,
                statusText: this.statusText,
                headers: {
                    'content-type': `${contentType}; charset=${this.charset}`
                }
            })
        }

        if (this.content?.trim()?.length <= 0) {
            this.content = data ?? ''
        }

        this.setStatusCode(this.statusCode, this.statusText)
        this.setHeader('content-type', `${contentType}; charset=${this.charset}`)
        return this
    }

    /**
     * Redirect to another URL.
     */
    redirect (location: string, status: number = 302, statusText?: string | undefined): HTTPResponse {
        this.setStatusCode(status, statusText)
        return redirect(location, this.statusCode, statusText)
    }

    /**
     * Dump the response.
     */
    public dump (): this {
        dump(
            this.headers.all(),
            { charset: this.charset },
            { version: this.version },
            { statusText: this.statusText },
            { statusCode: this.statusCode }
        )

        return this
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
