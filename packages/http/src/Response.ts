import type { DotNestedKeys, DotNestedValue, IHttpContext, IResponse } from '@h3ravel/contracts'
import { Str, safeDot } from '@h3ravel/support'

import { H3Event } from 'h3'
import { HttpResponse } from './Utilities/HttpResponse'
import { IApplication } from '@h3ravel/contracts'
import { Responsable } from './Utilities/Responsable'
import { ResponseCodes } from '@h3ravel/foundation'

export class Response extends HttpResponse implements IResponse {
    static codes = ResponseCodes

    /**
     * The current Http Context
     */
    context!: IHttpContext

    /**
     * 
     * @param app The current app instance
     * @param content The current H3 H3Event instance
     * @param status The http status code
     * @param headers The http headers
     */
    constructor(app: IApplication, content: H3Event)
    constructor(app: IApplication, content: string, status?: ResponseCodes, headers?: Record<string, (string | null)[] | string>)
    constructor(public app: IApplication, event?: H3Event | string, status: ResponseCodes = 200, headers: Record<string, (string | null)[] | string> = {}) {
        const hasHeaders = Object.entries(headers).length > 0
        const content = !(event instanceof H3Event) ? event : ''
        event = event instanceof H3Event ? event : app.make('http.context')?.event

        super(event)

        if (content || status !== 200 || hasHeaders) {
            this.setContent(content)
                .setStatusCode(status)

            if (hasHeaders)
                this.withHeaders(headers)
        }

        globalThis.response = () => this
    }

    /**
     * Sends content for the current web response.
     */
    public sendContent (type?: 'html' | 'json' | 'text' | 'xml', parse?: boolean): Responsable {
        if (!type) {
            type = Str.detectContentType(this.content)
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
    async view (viewPath: string, data: Record<string, any> | undefined, parse: boolean): Promise<Responsable>
    async view (viewPath: string, data?: Record<string, any> | undefined, parse?: boolean): Promise<Responsable | this> {
        const base = this.html(await this.app.make('edge').render(viewPath, data), parse!)
        return new Responsable(base.body!, base)
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
    async viewTemplate (content: string, data: Record<string, any> | undefined, parse: boolean): Promise<Responsable>
    async viewTemplate (content: string, data?: Record<string, any> | undefined, parse?: boolean): Promise<Responsable | this> {
        return this.html(await this.app.make('edge').renderRaw(content, data), parse!)
    }

    /**
     * 
     * @param content The content to serve
     * @param send if set to true, the content will be returned, instead of the Response instance
     * @returns 
     */
    html (content?: string): this
    html (content: string, parse: boolean): Responsable
    html (content?: string, parse?: boolean): Responsable | this {
        const base = this.httpResponse('text/html', content ?? this.content, parse!)
        if (base instanceof Response) {
            return new Responsable(base.content, { status: base.statusCode, statusText: base.statusText, headers: base.headers })
        }
        return new Responsable(base.body!, base)
    }

    /**
     * Send a JSON response.
     */
    json<T = unknown> (data?: T): this
    json<T = unknown> (data: T, parse: boolean): Responsable
    json<T = unknown> (data?: T, parse?: boolean): Responsable | this {
        const content = data ?? this.content
        return this.httpResponse(
            'application/json',
            typeof content !== 'string' ? JSON.stringify(content) : content,
            parse!
        )
    }

    /**
     * Send plain text.
     */
    text (content?: string): this
    text (content: string, parse: boolean): Responsable
    text (content?: string, parse?: boolean): Responsable | this {
        return this.httpResponse('text/plain', content ?? this.content, parse!) as never
    }

    /**
     * Send plain xml.
     */
    xml (data?: string): this
    xml (data: string, parse: boolean): Responsable
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
    private httpResponse (contentType: string, data: string, parse: boolean): Responsable
    private httpResponse (contentType: string, data?: string, parse?: boolean) {
        if (parse) {
            this.sendHeaders()
            return new Responsable(
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
    redirect (location: string, status: number = 302, statusText?: string | undefined): this {
        return this.setStatusCode(status, statusText || (status === 301 ? 'Moved Permanently' : 'Found'))
            .setContent(`<html><head><meta http-equiv="refresh" content="0; url=${location.replace(/"/g, '%22')}" /></head></html>`)
            .withHeaders({
                'content-type': 'text/html; charset=utf-8',
                location
            })
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
