import type { DotNestedKeys, DotNestedValue } from '../Utilities/ObjContract'

import type { H3Event } from 'h3'
import type { IApplication } from '../Core/IApplication'
import type { IHeaderBag } from './IHeaderBag'
import type { IHttpContext } from './IHttpContext'
import { IHttpRequest } from './IHttpRequest'
import type { IParamBag } from './IParamBag'
import { IRoute } from '../Routing/IRoute'
import type { ISessionManager } from '../Session/ISessionManager'
import type { IUploadedFile } from './IUploadedFile'
import { IUrl } from '../Url/IUrl'
import type { RequestMethod } from '../Utilities/Utilities'

type RequestObject = Record<string, any>;

/**
 * Interface for the Request contract, defining methods for handling HTTP request data.
 */
export abstract class IRequest<
    D extends Record<string, any> = Record<string, any>,
    R extends Record<string, any> = Record<string, any>,
    U extends Record<string, any> = Record<string, any>
> extends IHttpRequest {
    /**
     * The current app instance
     */
    abstract app: IApplication
    /**
     * Parsed request body
     */
    abstract body: unknown
    /**
     * The current Http Context
     */
    abstract context: IHttpContext
    /**
     * Gets route parameters.
     * @returns An object containing route parameters.
     */
    abstract params: NonNullable<H3Event['context']['params']>

    /**
     * The request attributes (parameters parsed from the PATH_INFO, ...).
     */
    public abstract attributes: IParamBag

    /**
     * Gets the request headers.
     * @returns An object containing request headers.
     */
    public abstract headers: IHeaderBag
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
        app: IApplication
    ): Promise<IRequest> {
        void event
        void app
        return Promise.resolve({} as IRequest)
    }
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
    abstract initialize (): void;
    /**
     * Retrieve all data from the instance (query + body).
     */
    abstract all<T = Record<string, any>> (keys?: string | string[]): T;
    /**
     * Retrieve an input item from the request.
     *
     * @param key
     * @param defaultValue
     * @returns
     */
    abstract input<K extends string | undefined> (key?: K, defaultValue?: any): K extends undefined ? RequestObject : any;
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
    abstract file (): Record<string, IUploadedFile>;
    abstract file (key?: undefined, defaultValue?: any, expectArray?: true): Record<string, IUploadedFile[]>;
    abstract file (key: string, defaultValue?: any, expectArray?: false | undefined): IUploadedFile;
    abstract file (key: string, defaultValue?: any, expectArray?: true): IUploadedFile[];
    /**
     * Get the user making the request.
     *
     * @param  guard
     */
    abstract user (guard?: string): U | undefined
    /**
     * Get the route handling the request.
     *
     * @param  param
     * @param  defaultRoute
     */
    abstract route (): IRoute
    abstract route (param?: string, defaultParam?: any): any
    /**
     * Determine if the uploaded data contains a file.
     *
     * @param  key
     * @return boolean
     */
    abstract hasFile (key: string): boolean;
    /**
     * Get an object with all the files on the request.
     */
    abstract allFiles (): Record<string, IUploadedFile | IUploadedFile[]>;
    /**
       * Extract and convert uploaded files from FormData.
       */
    abstract convertUploadedFiles (files: Record<string, IUploadedFile | IUploadedFile[]>): Record<string, IUploadedFile | IUploadedFile[]>;
    /**
     * Determine if the data contains a given key.
     *
     * @param keys
     * @returns
     */
    abstract has (keys: string[] | string): boolean;
    /**
     * Determine if the instance is missing a given key.
     */
    abstract missing (key: string | string[]): boolean;
    /**
     * Get a subset containing the provided keys with values from the instance data.
     *
     * @param keys
     * @returns
     */
    abstract only<T = Record<string, any>> (keys: string[]): T;
    /**
     * Get all of the data except for a specified array of items.
     *
     * @param keys
     * @returns
     */
    abstract except<T = Record<string, any>> (keys: string[]): T;
    /**
     * Merges new input data into the current request's input source.
     *
     * @param input - An object containing key-value pairs to merge.
     * @returns this - For fluent chaining.
     */
    abstract merge (input: Record<string, any>): this;
    /**
     * Merge new input into the request's input, but only when that key is missing from the request.
     *
     * @param input
     */
    abstract mergeIfMissing (input: Record<string, any>): this;
    /**
     * Get the keys for all of the input and files.
     */
    abstract keys (): string[];
    /**
     * Get an instance of the current session manager
     * 
     * @param key 
     * @param defaultValue 
     * @returns an instance of the current session manager.
     */
    public abstract session<K extends string | Record<string, any> | undefined = undefined> (key?: K, defaultValue?: any): K extends undefined
        ? ISessionManager
        : K extends string
        ? any : void | Promise<void>
    /**
     * Determine if the request is sending JSON.
     *
     * @return bool
     */
    abstract isJson (): boolean;
    /**
     * Determine if the current request probably expects a JSON response.
     *
     * @returns
     */
    abstract expectsJson (): boolean;
    /**
     * Determine if the current request is asking for JSON.
     *
     * @returns
     */
    abstract wantsJson (): boolean;
    /**
     * Gets a list of content types acceptable by the client browser in preferable order.
     * @returns {string[]}
     */
    abstract getAcceptableContentTypes (): string[];
    /**
     * Determine if the request is the result of a PJAX call.
     *
     * @return bool
     */
    abstract pjax (): boolean;
    /**
     * Returns true if the request is an XMLHttpRequest (AJAX).
     *
     * @alias isXmlHttpRequest()
     * @returns {boolean}
     */
    abstract ajax (): boolean;
    /**
     * Returns true if the request is an XMLHttpRequest (AJAX).
     */
    abstract isXmlHttpRequest (): boolean;
    /**
     * Returns the value of the requested header.
     */
    abstract getHeader (name: string): string | undefined | null;
    /**
     * Checks if the request method is of specified type.
     *
     * @param method Uppercase request method (GET, POST etc)
     */
    abstract isMethod (method: string): boolean;
    /**
     * Checks whether or not the method is safe.
     *
     * @see https://tools.ietf.org/html/rfc7231#section-4.2.1
     */
    abstract isMethodSafe (): boolean;
    /**
     * Checks whether or not the method is idempotent.
     */
    abstract isMethodIdempotent (): boolean;
    /**
     * Checks whether the method is cacheable or not.
     *
     * @see https://tools.ietf.org/html/rfc7231#section-4.2.3
     */
    abstract isMethodCacheable (): boolean;
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
    abstract getMethod (): RequestMethod;
    /**
     * Gets the "real" request method.
     *
     * @see getMethod()
     */
    abstract getRealMethod (): RequestMethod;
    /**
     * Get the client IP address.
     */
    abstract ip (): string | undefined;
    /**
     * Get the flashed input from previous request
     * 
     * @param key 
     * @param defaultValue 
     * @returns 
     */
    abstract old (): Promise<Record<string, any>>
    abstract old (key: string, defaultValue?: any): Promise<any>
    /**
     * Get a URI instance for the request.
     */
    abstract uri (): unknown;
    /**
     * Get the root URL for the application.
     *
     * @return string
     */
    abstract root (): string
    /**
     * Get the URL (no query string) for the request.
     *
     * @return string
     */
    abstract url (): string
    /**
     * Get the full URL for the request. 
     */
    abstract fullUrl (): string
    /**
     * Get the current path info for the request.
     */
    abstract path (): string
    /**
     * Return the Request instance.
     */
    abstract instance (): this;
    /**
     * Get the request method.
     */
    abstract method (): RequestMethod;
    /**
     * Get the JSON payload for the request.
     *
     * @param  key
     * @param  defaultValue
     * @return {InputBag}
     */
    abstract json<K extends string | undefined = undefined> (key?: string, defaultValue?: any): K extends undefined ? IParamBag : any;
    /**
     * Get the user resolver callback.
     */
    abstract getUserResolver (): (gaurd?: string) => U | undefined
    /**
     * Set the user resolver callback.
     *
     * @param  callback
     */
    abstract setUserResolver (callback: (gaurd?: string) => U): this
    /**
     * Get the route resolver callback.
     */
    abstract getRouteResolver (): () => IRoute | undefined
    /**
     * Set the route resolver callback.
     *
     * @param  callback
     */
    abstract setRouteResolver (callback: () => IRoute): this
    /**
     * Get the bearer token from the request headers.
     */
    abstract bearerToken (): string | undefined
    /**
     * Retrieve a request payload item from the request.
     * 
     * @param  key
     * @param  default
     */
    abstract post (key?: string, defaultValue?: any): any
    /**
     * Determine if a header is set on the request.
     *
     * @param  key
     */
    abstract hasHeader (key: string): boolean
    /**
     * Retrieve a header from the request.
     *
     * @param  key
     * @param  default
     */
    abstract header (key?: string, defaultValue?: any): any
    /**
     * Determine if a cookie is set on the request.
     *
     * @param  string  $key
     */
    abstract hasCookie (key: string): boolean
    /**
     * Retrieve a cookie from the request.
     *
     * @param  key
     * @param  default
     */
    abstract cookie (key?: string, defaultValue?: any): any
    /**
     * Retrieve a query string item from the request.
     *
     * @param  key
     * @param  default
     */
    abstract query (key?: string, defaultValue?: any): any
    /**
     * Retrieve a server variable from the request.
     *
     * @param  key
     * @param  default
     */
    abstract server (key?: string, defaultValue?: any): any
    /**
     * Returns the request body content.
     *
     * @param asStream If true, returns a ReadableStream instead of the parsed string
     * @return {string | ReadableStream | Promise<string | ReadableStream>}
     */
    abstract getContent (asStream?: boolean): string | ReadableStream;
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
    abstract get (key: string, defaultValue?: any): any;
    /**
     * Validate the incoming request data
     * 
     * @param data 
     * @param rules 
     * @param messages 
     */
    abstract validate (
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
    static enableHttpMethodParameterOverride (): void { }
    /**
     * Checks whether support for the _method request parameter is enabled.
     */
    static getHttpMethodParameterOverride (): boolean {
        return false
    }
    /**
     * Dump the items.
     *
     * @param  keys
     * @return this
     */
    abstract dump (...keys: any[]): this;
    /**
     * Get the base event
     */
    abstract getEvent (): H3Event;
    abstract getEvent<K extends DotNestedKeys<H3Event>> (key: K): DotNestedValue<H3Event, K>;
}
