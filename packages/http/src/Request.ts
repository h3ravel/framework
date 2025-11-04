import { getQuery, getRequestIP, getRequestURL, getRouterParams, parseCookies, type H3Event } from 'h3'
import { Arr, data_get, data_set, Obj, safeDot, Str } from '@h3ravel/support'
import type { DotNestedKeys, DotNestedValue } from '@h3ravel/shared'
import { IRequest } from '@h3ravel/shared'
import { Application } from '@h3ravel/core'
import { RequestMethod, RequestObject } from '@h3ravel/shared'
import { SuspiciousOperationException } from './Exceptions/SuspiciousOperationException'
import { InputBag } from './Bags/InputBag'
import { HeaderBag } from './Bags/HeaderBag'
import { ParamBag } from './Bags/ParamBag'
import { FileBag } from './Bags/FileBag'
import { ServerBag } from './Bags/ServerBag'
import { UploadedFile } from './UploadedFile'
import { FormRequest } from './FormRequest'
import { Url } from '@h3ravel/url'

export class Request implements IRequest {
    /**
     * Parsed request body
     */
    body: unknown

    /**
     * The decoded JSON content for the request.
     */
    #json!: InputBag

    #uri!: Url

    #method?: RequestMethod = undefined

    /**
     * Gets route parameters.
     * @returns An object containing route parameters.
     */
    public params!: NonNullable<H3Event['context']['params']>

    /**
     * All of the converted files for the request.
     */
    protected convertedFiles?: Record<string, UploadedFile | UploadedFile[]>

    /**
     * Form data from incoming request.
     * @returns The FormRequest object.
     */
    protected formData!: FormRequest

    /**
     * Request body parameters (POST).
     *
     * @see getPayload() for portability between content types
     */
    protected request!: InputBag

    /**
     * Uploaded files (FILES).
     */
    public files!: FileBag

    /**
     * Query string parameters (GET).
     */
    public query!: InputBag

    /**
     * Server and execution environment parameters
     */
    public server!: ServerBag

    /**
     * Cookies
     */
    public cookies !: InputBag

    /**
     * The request attributes (parameters parsed from the PATH_INFO, ...).
     */
    public attributes!: ParamBag

    /**
     * Gets the request headers.
     * @returns An object containing request headers.
     */
    public headers!: HeaderBag

    protected content?: ReadableStream | string | false | null = undefined

    protected static formats?: Record<string, string[]> | undefined | null = undefined

    protected static httpMethodParameterOverride: boolean = false

    /**
     * List of Acceptable Content Types
     */
    private acceptableContentTypes: string[] = []

    constructor(
        /**
         * The current H3 H3Event instance
         */
        private readonly event: H3Event,
        /**
         * The current app instance
         */
        public app: Application
    ) { }

    /**
     * Factory method to create a Request instance from an H3Event.
     */
    static async create (
        /**
         * The current H3 H3Event instance
         */
        event: H3Event,
        /**
         * The current app instance
         */
        app: Application
    ) {
        const instance = new Request(event, app)
        await instance.setBody()
        await instance.initialize()
        globalThis.request = () => instance
        return instance
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
    public async initialize (): Promise<void> {
        this.params = getRouterParams(this.event)
        this.request = new InputBag(this.formData ? this.formData.input() : {}, this.event)
        this.query = new InputBag(getQuery(this.event), this.event)
        this.attributes = new ParamBag(getRouterParams(this.event), this.event)
        this.cookies = new InputBag(parseCookies(this.event), this.event)
        this.files = new FileBag(this.formData ? this.formData.files() : {}, this.event)
        this.server = new ServerBag(Object.fromEntries(this.event.req.headers.entries()), this.event)
        this.headers = new HeaderBag(this.server.getHeaders())
        this.acceptableContentTypes = []
        // this.languages = undefined
        // this.charsets = undefined
        // this.encodings = undefined
        // this.pathInfo = undefined
        // this.requestUri = undefined
        // this.baseUrl = undefined
        // this.basePath = undefined
        this.#method = undefined
        // this.format = undefined
        this.#uri = (await import(String('@h3ravel/url'))).Url.of(getRequestURL(this.event).toString(), this.app)
    }

    private async setBody () {
        const type = this.event.req.headers.get('content-type') || ''

        if (this.body) {
            return
        }

        // Automatically determine and parse the request body
        if (type.includes('application/json')) {
            this.body = await this.event.req.json().catch(() => ({}))
            this.content = this.body as string
        } else if (type.includes('form-data') || type.includes('x-www-form-urlencoded')) {
            this.formData = new FormRequest(await this.event.req.formData())
            this.body = this.formData.all()
            this.content = JSON.stringify(this.formData.input())
        } else if (type.startsWith('text/')) {
            this.body = await this.event.req.text()
            this.content = this.body as ReadableStream
        } else {
            // Fallback to stream
            const content = this.event.req.body
            this.content = content

            if (content instanceof ReadableStream) {
                const reader = content.getReader()
                const chunks: Uint8Array[] = []
                let done = false
                while (!done) {
                    const { value, done: isDone } = await reader.read()
                    if (value) chunks.push(value)
                    done = isDone
                }

                this.body = new TextDecoder().decode(
                    new Uint8Array(chunks.flatMap(chunk => Array.from(chunk)))
                )

            } else {
                this.body = content
            }
        }
    }

    /**
     * Retrieve all data from the instance (query + body).
     */
    public all<T = Record<string, any>> (keys?: string | string[]): T {
        const input = Obj.deepMerge({}, this.input(), this.allFiles())

        if (!keys) {
            return input as T
        }

        const results: Record<string, any> = {}
        const list = Array.isArray(keys) ? keys : [keys]

        for (const key of list) {
            data_set(results, key, Obj.get(input, key))
        }

        return results as T
    }

    /**
     * Retrieve an input item from the request.
     * 
     * @param key 
     * @param defaultValue 
     * @returns 
     */
    public input<K extends string | undefined> (
        key?: K,
        defaultValue?: any
    ): K extends undefined ? RequestObject : any {
        const source = { ...this.getInputSource().all(), ...this.query.all() }

        return key ? data_get(source, key, defaultValue) : Arr.except(source, ['_method'])
    }

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
    public file<K extends string | undefined = undefined, E extends boolean | undefined = undefined> (
        key?: K,
        defaultValue?: any,
        expectArray?: E
    ): K extends undefined
        ? Record<string, E extends true ? UploadedFile[] : UploadedFile>
        : E extends true ? UploadedFile[] : UploadedFile {
        const files = data_get(this.allFiles(), key!, defaultValue)

        if (!files) return defaultValue

        if (Array.isArray(files)) {
            // If user wants an array, return it directly
            // otherwise, return only the first item
            return (expectArray ? files : files[0]) as any
        }

        // Single file case
        return files as any
    }

    /**
     * Determine if the uploaded data contains a file.
     *
     * @param  key
     * @return boolean
     */
    public hasFile (key: string): boolean {
        let files = this.file(key, undefined, true)

        if (!Array.isArray(files)) {
            files = [files]
        }
        return files.some(e => this.isValidFile(e))
    }

    /**
     * Check that the given file is a valid file instance.
     *
     * @param file
     * @return boolean
     */
    protected isValidFile (file: UploadedFile) {
        return file.content instanceof File && file.size > 0
    }

    /**
     * Get an object with all the files on the request.
     */
    public allFiles () {
        if (this.convertedFiles) return this.convertedFiles

        const entries = Object
            .entries(this.files.all())
            .filter((e): e is [string, UploadedFile | UploadedFile[]] => e[1] != null)

        const files = Object.fromEntries(entries)
        this.convertedFiles = this.convertUploadedFiles(files)
        return this.convertedFiles
    }

    /**
       * Extract and convert uploaded files from FormData.
       */
    public convertUploadedFiles (
        files: Record<string, UploadedFile | UploadedFile[]>
    ): Record<string, UploadedFile | UploadedFile[]> {
        if (!this.formData)
            return files

        for (const [key, value] of Object.entries(this.formData.files())) {
            // Skip non-file values
            if (!(value instanceof File)) continue

            if (key.endsWith('[]')) {
                // Handle arrays like files[]
                const normalizedKey = key.slice(0, -2)
                if (!files[normalizedKey]) {
                    files[normalizedKey] = []
                }
                ; (files[normalizedKey] as UploadedFile[]).push(
                    UploadedFile.createFromBase(value)
                )
            } else {
                files[key] = UploadedFile.createFromBase(value)
            }
        }

        return files
    }

    /**
     * Determine if the data contains a given key.
     * 
     * @param keys 
     * @returns 
     */
    public has (keys: string[] | string): boolean {
        return Obj.has(this.all(), keys)
    }

    /**
     * Determine if the instance is missing a given key.
     */
    public missing (key: string | string[]) {
        const keys = Array.isArray(key) ? key : [key]

        return !this.has(keys)
    }

    /**
     * Get a subset containing the provided keys with values from the instance data.
     * 
     * @param keys 
     * @returns 
     */
    public only<T = Record<string, any>> (keys: string[]): T {
        const data = Object.entries(this.all<Record<string, T>>()).filter(([key]) => keys.includes(key))

        return Object.fromEntries(data) as T
    }

    /**
     * Get all of the data except for a specified array of items.
     * 
     * @param keys 
     * @returns 
     */
    public except<T = Record<string, any>> (keys: string[]): T {
        const data = Object.entries(this.all<Record<string, T>>()).filter(([key]) => !keys.includes(key))

        return Object.fromEntries(data) as T
    }

    /**
     * Merges new input data into the current request's input source.
     *
     * @param input - An object containing key-value pairs to merge.
     * @returns this - For fluent chaining.
     */
    public merge (input: Record<string, any>): this {
        const source = this.getInputSource()

        for (const [key, value] of Object.entries(input)) {
            source.set(key, value)
        }

        return this
    }

    /**
     * Merge new input into the request's input, but only when that key is missing from the request.
     *
     * @param input
     */
    public mergeIfMissing (input: Record<string, any>) {
        return this.merge(
            Object.fromEntries(Object.entries(input).filter(([key]) => this.missing(key)))
        )
    }

    /**
     * Get the keys for all of the input and files.
     */
    public keys (): string[] {
        return [...Object.keys(this.input()), ...this.files.keys()]
    }

    /**
     * Determine if the request is sending JSON.
     *
     * @return bool
     */
    public isJson () {
        return Str.contains(this.getHeader('CONTENT_TYPE') ?? '', ['/json', '+json'])
    }

    /**
     * Determine if the current request probably expects a JSON response.
     * 
     * @returns 
     */
    public expectsJson (): boolean {
        return Str.contains(this.getHeader('Accept') ?? '', 'application/json')

    }

    /**
     * Determine if the current request is asking for JSON.
     * 
     * @returns 
     */
    public wantsJson (): boolean {
        const acceptable = this.getAcceptableContentTypes()

        return !!acceptable[0] && Str.contains(acceptable[0].toLowerCase(), ['/json', '+json'])
    }

    /**
     * Gets a list of content types acceptable by the client browser in preferable order.
     * @returns {string[]}
     */
    public getAcceptableContentTypes (): string[] {
        if (this.acceptableContentTypes.length > 0) {
            return this.acceptableContentTypes
        }

        const accept = this.getHeader('accept')
        if (!accept) return []

        // Split and clean up Accept header values
        const types = accept
            .split(',')
            .map(type => type.trim())
            .map(type => type.split(';')[0]) // strip quality params (e.g. ;q=0.8)
            .filter(Boolean)

        return (this.acceptableContentTypes = types)
    }

    /**
     * Determine if the request is the result of a PJAX call.
     *
     * @return bool
     */
    public pjax () {
        return this.headers.get<boolean>('X-PJAX') == true
    }

    /**
     * Returns true if the request is an XMLHttpRequest (AJAX).
     * 
     * @alias isXmlHttpRequest()
     * @returns {boolean}
     */
    public ajax (): boolean {
        return this.isXmlHttpRequest()
    }

    /**
     * Returns true if the request is an XMLHttpRequest (AJAX).
     */
    public isXmlHttpRequest (): boolean {
        return 'XMLHttpRequest' === this.getHeader('X-Requested-With')
    }

    /**
     * Returns the value of the requested header.
     */
    public getHeader (name: string): string | undefined | null {
        return this.headers.get<string>(name)
    }


    /**
     * Checks if the request method is of specified type.
     *
     * @param method Uppercase request method (GET, POST etc)
     */
    public isMethod (method: string): boolean {
        return this.getMethod() === method.toUpperCase()
    }

    /**
     * Checks whether or not the method is safe.
     *
     * @see https://tools.ietf.org/html/rfc7231#section-4.2.1
     */
    public isMethodSafe (): boolean {
        return ['GET', 'HEAD', 'OPTIONS', 'TRACE'].includes(this.getMethod())
    }

    /**
     * Checks whether or not the method is idempotent.
     */
    public isMethodIdempotent (): boolean {
        return ['HEAD', 'GET', 'PUT', 'DELETE', 'TRACE', 'OPTIONS', 'PURGE'].includes(this.getMethod())
    }

    /**
     * Checks whether the method is cacheable or not.
     *
     * @see https://tools.ietf.org/html/rfc7231#section-4.2.3
     */
    public isMethodCacheable (): boolean {
        return ['GET', 'HEAD'].includes(this.getMethod())
    }

    /**
     * Initializes HTTP request formats.
     */
    protected static initializeFormats (): void {
        this.formats = {
            html: ['text/html', 'application/xhtml+xml'],
            txt: ['text/plain'],
            js: ['application/javascript', 'application/x-javascript', 'text/javascript'],
            css: ['text/css'],
            json: ['application/json', 'application/x-json'],
            jsonld: ['application/ld+json'],
            xml: ['text/xml', 'application/xml', 'application/x-xml'],
            rdf: ['application/rdf+xml'],
            atom: ['application/atom+xml'],
            rss: ['application/rss+xml'],
            form: ['application/x-www-form-urlencoded', 'multipart/form-data'],
        }
    }

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
    public getMethod (): RequestMethod {
        if (this.#method) {
            return this.#method
        }

        this.#method = this.getRealMethod()

        if ('POST' !== this.#method) {
            return this.#method
        }

        let method = this.event.req.headers.get('X-HTTP-METHOD-OVERRIDE') as RequestMethod

        if (!method && Request.httpMethodParameterOverride) {
            method = this.request.get('_method', this.query.get('_method', 'POST')) as RequestMethod
        }

        if (typeof method !== 'string') {
            return this.#method
        }

        method = method.toUpperCase() as RequestMethod

        if (['GET', 'HEAD', 'POST', 'PUT', 'DELETE', 'CONNECT', 'OPTIONS', 'PATCH', 'PURGE', 'TRACE'].includes(method)) {
            this.#method = method
            return this.#method
        }

        if (!/^[A-Z]+$/.test(method)) {
            throw new SuspiciousOperationException('Invalid HTTP method override.')
        }

        this.#method = method
        return this.#method
    }

    /**
     * Gets the "real" request method.
     *
     * @see getMethod()
     */
    public getRealMethod (): RequestMethod {
        return this.event.req.method.toUpperCase() as RequestMethod
    }

    /**
     * Get the client IP address.
     */
    public ip (): string | undefined {
        return getRequestIP(this.event)
    }

    /**
     * Get a URI instance for the request.
     */
    public uri (): Url {
        return this.#uri
    }

    /**
     * Get the full URL for the request. 
     */
    public fullUrl (): string {
        return this.event.req.url
    }

    /**
     * Return the Request instance.
     */
    public instance (): this {
        return this
    }

    /**
     * Get the request method.
     */
    public method (): RequestMethod {
        return this.getMethod()
    }

    /**
     * Get the JSON payload for the request.
     *
     * @param  key
     * @param  defaultValue
     * @return {InputBag}
     */
    public json<K extends string | undefined = undefined> (
        key?: string,
        defaultValue?: any
    ): K extends undefined ? InputBag : any {
        if (!this.#json) {
            let json = this.getContent() as string | object
            if (typeof json == 'string') {
                json = JSON.parse(json || '{}') as object
            }

            this.#json = new InputBag(json, this.event)
        }

        if (!key) {
            return this.#json
        }

        return Obj.get(this.#json.all(), key, defaultValue)
    }

    /**
     * Get the input source for the request.
     *
     * @return {InputBag}
     */
    protected getInputSource (): InputBag {
        if (this.isJson()) {
            return this.json()
        }

        return ['GET', 'HEAD'].includes(this.getRealMethod()) ? this.query : this.request
    }

    /**
     * Returns the request body content.
     *
     * @param asStream If true, returns a ReadableStream instead of the parsed string
     * @return {string | ReadableStream | Promise<string | ReadableStream>}
     */
    public getContent (asStream = false): string | ReadableStream {
        let content = this.body

        // Handle cases where body was manually set (like in tests)
        if (content !== undefined && content !== null) {
            if (asStream) {
                // If content is a ReadableStream, rewind-like behavior doesn’t apply directly.
                // Recreate a new stream from string content if needed.
                if (content instanceof ReadableStream) {
                    return content
                }

                const encoder = new TextEncoder()
                return new ReadableStream({
                    start (controller) {
                        controller.enqueue(encoder.encode(String(content)))
                        controller.close()
                    }
                })
            }

            if (typeof content === 'string') {
                return content
            }

        }

        // When content was never read — use native H3 methods
        if (asStream) {
            // H3 provides the raw stream at this.event.req.body supplied to this.content
            return this.content as ReadableStream
        }

        // Default: read as text
        content = this.content
        this.body = content
        return content as never
    }

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
    public get (key: string, defaultValue?: any): any {
        const result = this.attributes.get(key, this)

        if (this !== result) {
            return result
        }

        if (this.query.has(key)) {
            return this.query.all()[key]
        }

        if (this.request.has(key)) {
            return this.request.all()[key]
        }

        return defaultValue
    }

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
    public static enableHttpMethodParameterOverride (): void {
        this.httpMethodParameterOverride = true
    }

    /**
     * Checks whether support for the _method request parameter is enabled.
     */
    public static getHttpMethodParameterOverride (): boolean {
        return this.httpMethodParameterOverride
    }

    /**
     * Dump the items.
     *
     * @param  keys
     * @return this
     */
    public dump (...keys: any[]): this {
        if (keys.length > 0) this.only(keys).then(dump)
        else this.all().then(dump)

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
