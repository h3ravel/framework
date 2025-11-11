import type { DotNestedKeys, DotNestedValue } from './ObjContract'

import type { H3Event } from 'h3'
import type { IApplication } from './IApplication'
import { IParamBag } from './IParamBag'
import { IUploadedFile } from './IUploadedFile'
import { RequestMethod } from './IHttp'

type RequestObject = Record<string, any>;

/**
 * Interface for the Request contract, defining methods for handling HTTP request data.
 */
export declare class IRequest<
    D extends Record<string, any> = Record<string, any>,
    R extends Record<string, any> = Record<string, any>
> {
    /**
     * The current app instance
     */
    app: IApplication
    /**
     * Parsed request body
     */
    body: unknown
    /**
     * Gets route parameters.
     * @returns An object containing route parameters.
     */
    params: NonNullable<H3Event['context']['params']>
    /**
     * Uploaded files (FILES).
     */
    constructor(
        /**
         * The current H3 H3Event instance
         */
        event: H3Event,
        /**
         * The current app instance
         */
        app: IApplication);
    /**
     * Factory method to create a Request instance from an H3Event.
     */
    static create (
        /**
         * The current H3 H3Event instance
         */
        event: H3Event,
        /**
         * The current app instance
         */
        app: IApplication): Promise<Request>;
    /**
     * Sets the parameters for this request.
     *
     * This method also re-initializes all properties.
     *
     * @param attributes
     * @param cookies    The COOKIE parameters
     * @param files      The FILES parameters
     * @param server     The SERVER parameters
     * @param content    The raw body data
     */
    initialize (): Promise<void>;
    /**
     * Retrieve all data from the instance (query + body).
     */
    all<T = Record<string, any>> (keys?: string | string[]): T;
    /**
     * Retrieve an input item from the request.
     *
     * @param key
     * @param defaultValue
     * @returns
     */
    input<K extends string | undefined> (key?: K, defaultValue?: any): K extends undefined ? RequestObject : any;
    /**
     * Retrieve a file from the request.
     *
     * By default a single `UploadedFile` instance will always be returned by
     * the method (first file in property when there are multiple), unless
     * the `expectArray` parameter is set to true, in which case, the method
     * returns an `UploadedFile[]` array.
     *
     * @param key
     * @param defaultValue
     * @param expectArray set to true to return an `UploadedFile[]` array.
     * @returns
     */
    file<K extends string | undefined = undefined, E extends boolean | undefined = undefined> (key?: K, defaultValue?: any, expectArray?: E): K extends undefined ? Record<string, E extends true ? IUploadedFile[] : IUploadedFile> : E extends true ? IUploadedFile[] : IUploadedFile;
    /**
     * Determine if the uploaded data contains a file.
     *
     * @param  key
     * @return boolean
     */
    hasFile (key: string): boolean;
    /**
     * Get an object with all the files on the request.
     */
    allFiles (): Record<string, IUploadedFile | IUploadedFile[]>;
    /**
       * Extract and convert uploaded files from FormData.
       */
    convertUploadedFiles (files: Record<string, IUploadedFile | IUploadedFile[]>): Record<string, IUploadedFile | IUploadedFile[]>;
    /**
     * Determine if the data contains a given key.
     *
     * @param keys
     * @returns
     */
    has (keys: string[] | string): boolean;
    /**
     * Determine if the instance is missing a given key.
     */
    missing (key: string | string[]): boolean;
    /**
     * Get a subset containing the provided keys with values from the instance data.
     *
     * @param keys
     * @returns
     */
    only<T = Record<string, any>> (keys: string[]): T;
    /**
     * Get all of the data except for a specified array of items.
     *
     * @param keys
     * @returns
     */
    except<T = Record<string, any>> (keys: string[]): T;
    /**
     * Merges new input data into the current request's input source.
     *
     * @param input - An object containing key-value pairs to merge.
     * @returns this - For fluent chaining.
     */
    merge (input: Record<string, any>): this;
    /**
     * Merge new input into the request's input, but only when that key is missing from the request.
     *
     * @param input
     */
    mergeIfMissing (input: Record<string, any>): this;
    /**
     * Get the keys for all of the input and files.
     */
    keys (): string[];
    /**
     * Determine if the request is sending JSON.
     *
     * @return bool
     */
    isJson (): boolean;
    /**
     * Determine if the current request probably expects a JSON response.
     *
     * @returns
     */
    expectsJson (): boolean;
    /**
     * Determine if the current request is asking for JSON.
     *
     * @returns
     */
    wantsJson (): boolean;
    /**
     * Gets a list of content types acceptable by the client browser in preferable order.
     * @returns {string[]}
     */
    getAcceptableContentTypes (): string[];
    /**
     * Determine if the request is the result of a PJAX call.
     *
     * @return bool
     */
    pjax (): boolean;
    /**
     * Returns true if the request is an XMLHttpRequest (AJAX).
     *
     * @alias isXmlHttpRequest()
     * @returns {boolean}
     */
    ajax (): boolean;
    /**
     * Returns true if the request is an XMLHttpRequest (AJAX).
     */
    isXmlHttpRequest (): boolean;
    /**
     * Returns the value of the requested header.
     */
    getHeader (name: string): string | undefined | null;
    /**
     * Checks if the request method is of specified type.
     *
     * @param method Uppercase request method (GET, POST etc)
     */
    isMethod (method: string): boolean;
    /**
     * Checks whether or not the method is safe.
     *
     * @see https://tools.ietf.org/html/rfc7231#section-4.2.1
     */
    isMethodSafe (): boolean;
    /**
     * Checks whether or not the method is idempotent.
     */
    isMethodIdempotent (): boolean;
    /**
     * Checks whether the method is cacheable or not.
     *
     * @see https://tools.ietf.org/html/rfc7231#section-4.2.3
     */
    isMethodCacheable (): boolean;
    /**
     * Gets the request "intended" method.
     *
     * If the X-HTTP-Method-Override header is set, and if the method is a POST,
     * then it is used to determine the "real" intended HTTP method.
     *
     * The _method request parameter can also be used to determine the HTTP method,
     * but only if enableHttpMethodParameterOverride() has been called.
     *
     * The method is always an uppercased string.
     *
     * @see getRealMethod()
     */
    getMethod (): RequestMethod;
    /**
     * Gets the "real" request method.
     *
     * @see getMethod()
     */
    getRealMethod (): RequestMethod;
    /**
     * Get the client IP address.
     */
    ip (): string | undefined;
    /**
     * Get a URI instance for the request.
     */
    uri (): unknown;
    /**
     * Get the full URL for the request.
     */
    fullUrl (): string;
    /**
     * Return the Request instance.
     */
    instance (): this;
    /**
     * Get the request method.
     */
    method (): RequestMethod;
    /**
     * Get the JSON payload for the request.
     *
     * @param  key
     * @param  defaultValue
     * @return {InputBag}
     */
    json<K extends string | undefined = undefined> (key?: string, defaultValue?: any): K extends undefined ? IParamBag : any;
    /**
     * Returns the request body content.
     *
     * @param asStream If true, returns a ReadableStream instead of the parsed string
     * @return {string | ReadableStream | Promise<string | ReadableStream>}
     */
    getContent (asStream?: boolean): string | ReadableStream;
    /**
     * Gets a "parameter" value from any bag.
     *
     * This method is mainly useful for libraries that want to provide some flexibility. If you don't need the
     * flexibility in controllers, it is better to explicitly get request parameters from the appropriate
     * public property instead (attributes, query, request).
     *
     * Order of precedence: PATH (routing placeholders or custom attributes), GET, POST
     *
     * @internal use explicit input sources instead
     */
    get (key: string, defaultValue?: any): any;
    /**
     * Validate the incoming request data
     * 
     * @param data 
     * @param rules 
     * @param messages 
     */
    validate (
        rules: R,
        messages?: Partial<Record<string, string>>
    ): Promise<D>;
    /**
     * Enables support for the _method request parameter to determine the intended HTTP method.
     *
     * Be warned that enabling this feature might lead to CSRF issues in your code.
     * Check that you are using CSRF tokens when required.
     * If the HTTP method parameter override is enabled, an html-form with method "POST" can be altered
     * and used to send a "PUT" or "DELETE" request via the _method request parameter.
     * If these methods are not protected against CSRF, this presents a possible vulnerability.
     *
     * The HTTP method can only be overridden when the real HTTP method is POST.
     */
    static enableHttpMethodParameterOverride (): void;
    /**
     * Checks whether support for the _method request parameter is enabled.
     */
    static getHttpMethodParameterOverride (): boolean;
    /**
     * Dump the items.
     *
     * @param  keys
     * @return this
     */
    dump (...keys: any[]): this;
    /**
     * Get the base event
     */
    getEvent (): H3Event;
    getEvent<K extends DotNestedKeys<H3Event>> (key: K): DotNestedValue<H3Event, K>;
}
