import { DotNestedKeys, DotNestedValue } from './ObjContract'

import type { H3Event } from 'h3'

/**
 * Interface for the Request contract, defining methods for handling HTTP request data.
 */
export interface IRequest {
    /**
     * Gets all input data (query parameters, route parameters, and body).
     * @returns A promise resolving to an object containing all input data.
     */
    all<T = Record<string, unknown>> (): Promise<T>;

    /**
     * Gets a single input field from query or body.
     * @param key - The key of the input field.
     * @param defaultValue - Optional default value if the key is not found.
     * @returns A promise resolving to the value of the input field or the default value.
     */
    input<T = unknown> (key: string, defaultValue?: T): Promise<T>;

    /**
     * Gets route parameters.
     * @returns An object containing route parameters.
     */
    params<T = Record<string, string>> (): T;

    /**
     * Gets query parameters.
     * @returns An object containing query parameters.
     */
    query<T = Record<string, string>> (): T;

    /**
     * Gets the underlying event object or a specific property of it.
     * @param key - Optional key to access a nested property of the event.
     * @returns The entire event object or the value of the specified property.
     */
    getEvent (): H3Event;
    getEvent<K extends DotNestedKeys<H3Event>> (key: K): DotNestedValue<H3Event, K>;
}
