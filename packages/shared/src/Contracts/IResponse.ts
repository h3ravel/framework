import { DotNestedKeys, DotNestedValue } from './ObjContract'

import type { H3Event } from 'h3'
import type { IApplication } from './IApplication';

/**
 * Interface for the Response contract, defining methods for handling HTTP responses.
 */
export interface IResponse {
    /**
     * The current app instance
     */
    app: IApplication

    /**
     * Sets the HTTP status code for the response.
     * @param code - The HTTP status code.
     * @returns The instance for method chaining.
     */
    setStatusCode (code: number): this;

    /**
     * Sets a response header.
     * @param name - The header name.
     * @param value - The header value.
     * @returns The instance for method chaining.
     */
    setHeader (name: string, value: string): this;

    /**
     * Sends an HTML response.
     * @param content - The HTML content to send.
     * @returns The HTML content.
     */
    html (content: string): string;

    /**
     * Sends a JSON response.
     * @param data - The data to send as JSON.
     * @returns The input data.
     */
    json<T = unknown> (data: T): T;

    /**
     * Sends a plain text response.
     * @param data - The text content to send.
     * @returns The text content.
     */
    text (data: string): string;

    /**
     * Redirects to another URL.
     * @param url - The URL to redirect to.
     * @param status - The HTTP status code for the redirect (default: 302).
     * @returns The redirect URL.
     */
    redirect (url: string, status?: number): string;

    /**
     * Gets the underlying event object or a specific property of it.
     * @param key - Optional key to access a nested property of the event.
     * @returns The entire event object or the value of the specified property.
     */
    getEvent (): H3Event;
    getEvent<K extends DotNestedKeys<H3Event>> (key: K): DotNestedValue<H3Event, K>;
}
