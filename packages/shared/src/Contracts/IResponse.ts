import type { DotNestedKeys, DotNestedValue } from '@h3ravel/shared'
import type { H3Event, HTTPResponse } from 'h3'

import type { IApplication } from './IApplication'
import { IHttpResponse } from './IHttpResponse'

/**
 * Interface for the Response contract, defining methods for handling HTTP responses.
 */
export interface IResponse extends IHttpResponse {
    /**
     * The current app instance
     */
    app: IApplication;
    /**
     * Sends content for the current web response.
     */
    sendContent (type?: 'html' | 'json' | 'text' | 'xml', parse?: boolean): unknown;
    /**
     * Sends content for the current web response.
     */
    send (type?: 'html' | 'json' | 'text' | 'xml'): unknown;

    /**
     * Use an edge view as content
     * 
     * @param viewPath The path to the view file
     * @param send if set to true, the content will be returned, instead of the Response instance
     * @returns 
     */
    view (viewPath: string, data?: Record<string, any> | undefined): Promise<this>
    view (viewPath: string, data: Record<string, any> | undefined, parse: boolean): Promise<HTTPResponse>

    /**
     * 
     * Parse content as edge view
     * 
     * @param content The content to serve
     * @param send if set to true, the content will be returned, instead of the Response instance
     * @returns 
     */
    viewTemplate (content: string, data?: Record<string, any> | undefined): Promise<this>
    viewTemplate (content: string, data: Record<string, any> | undefined, parse: boolean): Promise<HTTPResponse>
    /**
     *
     * @param content The content to serve
     * @param send if set to true, the content will be returned, instead of the Response instance
     * @returns
     */
    html (content?: string): this;
    html (content: string, parse: boolean): HTTPResponse;
    /**
     * Send a JSON response.
     */
    json<T = unknown> (data?: T): this;
    json<T = unknown> (data: T, parse: boolean): T;
    /**
     * Send plain text.
     */
    text (content?: string): this;
    text (content: string, parse: boolean): HTTPResponse;
    /**
     * Send plain xml.
     */
    xml (data?: string): this;
    xml (data: string, parse: boolean): HTTPResponse;
    /**
     * Redirect to another URL.
     */
    redirect (location: string, status?: number, statusText?: string | undefined): this;
    /**
     * Dump the response.
     */
    dump (): this;
    /**
     * Get the base event
     */
    getEvent (): H3Event;
    getEvent<K extends DotNestedKeys<H3Event>> (key: K): DotNestedValue<H3Event, K>;
}
