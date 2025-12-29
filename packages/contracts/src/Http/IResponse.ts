import { ClassConstructor, ConcreteConstructor } from '../Utilities/Utilities'
import type { DotNestedKeys, DotNestedValue } from '@h3ravel/shared'
import { type H3Event, HTTPResponse } from 'h3'

import { IApplication } from '../Core/IApplication'
import { IHttpContext } from './IHttpContext'
import { IHttpResponse } from './IHttpResponse'
import { IRequest } from './IRequest'

/**
 * Interface for the Response contract, defining methods for handling HTTP responses.
 */
export abstract class IResponse extends IHttpResponse {
    /**
     * The current app instance
     */
    abstract app: IApplication
    /**
     * The current Http Context
     */
    abstract context: IHttpContext
    /**
     * Sends content for the current web response.
     */
    abstract sendContent (type?: 'html' | 'json' | 'text' | 'xml', parse?: boolean): unknown;
    /**
     * Sends content for the current web response.
     */
    abstract send (type?: 'html' | 'json' | 'text' | 'xml'): unknown;

    /**
     * Use an edge view as content
     * 
     * @param viewPath The path to the view file
     * @param send if set to true, the content will be returned, instead of the Response instance
     * @returns 
     */
    abstract view (viewPath: string, data?: Record<string, any> | undefined): Promise<this>
    abstract view (viewPath: string, data: Record<string, any> | undefined, parse: boolean): Promise<IResponsable>

    /**
     * 
     * Parse content as edge view
     * 
     * @param content The content to serve
     * @param send if set to true, the content will be returned, instead of the Response instance
     * @returns 
     */
    abstract viewTemplate (content: string, data?: Record<string, any> | undefined): Promise<this>
    abstract viewTemplate (content: string, data: Record<string, any> | undefined, parse: boolean): Promise<IResponsable>
    /**
     *
     * @param content The content to serve
     * @param send if set to true, the content will be returned, instead of the Response instance
     * @returns
     */
    abstract html (content?: string): this;
    abstract html (content: string, parse: boolean): IResponsable;
    /**
     * Send a JSON response.
     */
    abstract json<T = unknown> (data?: T): this;
    abstract json<T = unknown> (data: T, parse: boolean): T;
    /**
     * Send plain text.
     */
    abstract text (content?: string): this;
    abstract text (content: string, parse: boolean): IResponsable;
    /**
     * Send plain xml.
     */
    abstract xml (data?: string): this;
    abstract xml (data: string, parse: boolean): IResponsable;
    /**
     * Redirect to another URL.
     */
    abstract redirect (location: string, status?: number, statusText?: string | undefined): this;
    /**
     * Dump the response.
     */
    abstract dump (): this;
    /**
     * Get the base event
     */
    abstract getEvent (): H3Event;
    abstract getEvent<K extends DotNestedKeys<H3Event>> (key: K): DotNestedValue<H3Event, K>;
}

export abstract class IResponsable extends HTTPResponse {
    abstract toResponse (request: IRequest): IResponse
    abstract HTTPResponse (): HTTPResponse
}

export type ResponsableType<X = string> = IResponse | IResponsable | ConcreteConstructor<ClassConstructor> | string | X