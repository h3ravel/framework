import { getRequestIP, type H3Event } from 'h3'
import { Arr, data_get, data_set, Obj, safeDot, Str } from '@h3ravel/support'
import type { DotNestedKeys, DotNestedValue, ISessionManager, IRequest, IRoute, RulesForData, MessagesForRules } from '@h3ravel/contracts'
import { IApplication } from '@h3ravel/contracts'
import { RequestMethod, RequestObject, IUrl } from '@h3ravel/contracts'
import { InputBag } from './Utilities/InputBag'
import { UploadedFile } from './UploadedFile'
import { FormRequest } from './FormRequest'
import { HttpRequest } from './Utilities/HttpRequest'

export class Request<
    D extends Record<string, any> = Record<string, any>,
    R extends RulesForData<D> = RulesForData<D>,
    U extends Record<string, any> = Record<string, any>
> extends HttpRequest implements IRequest<D, R> {
    /**
     * The decoded JSON content for the request.
     */
    #json!: InputBag

    /**
     * All of the converted files for the request.
     */
    protected convertedFiles?: Record<string, UploadedFile | UploadedFile[]>

    /**
     * The route resolver callback.
     */
    protected routeResolver?: () => IRoute

    /**
     * The user resolver callback.
     */
    protected userResolver?: (guard?: string) => U

    constructor(
        /**
         * The current H3 H3Event instance
         */
        event: H3Event,
        /**
         * The current app instance
         */
        app: IApplication
    ) {
        if (Request.httpMethodParameterOverride) {
            HttpRequest.enableHttpMethodParameterOverride()
        }
        super(event, app)
    }

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
        app: IApplication
    ) {
        const instance = new Request(event, app)
        await instance.setBody()
        await instance.initialize()
        globalThis.old = (...args: any[]) => instance.old(args?.[0], args?.[1]) as never
        globalThis.request = () => instance
        globalThis.session = (...args: any[]) => instance.session(...args)
        return instance
    }

    /**
     * Factory method to create a syncronous Request instance from an H3Event.
     */
    static createSync (
        /**
         * The current H3 H3Event instance
         */
        event: H3Event,
        /**
         * The current app instance
         */
        app: IApplication
    ) {
        const instance = new Request(event, app)
        instance.content = event.req.body
        instance.body = instance.content
        instance.buildRequirements()
        instance.sessionManagerClass = {} as never
        globalThis.old = (...args: any[]) => instance.old(args?.[0], args?.[1]) as never
        globalThis.request = () => instance
        globalThis.session = (...args: any[]) => instance.session(...args)
        return instance
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
     * Validate the incoming request data
     * 
     * @param data 
     * @param rules 
     * @param messages 
     */
    async validate (
        rules: R,
        messages: Partial<Record<MessagesForRules<R>, string>> = {}
    ): Promise<D> {
        const { Validator } = await import('@h3ravel/validation')

        const validator = new Validator(this.all(), rules, messages)

        return await validator.validate() as D
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
    public file (): Record<string, UploadedFile>;
    public file (key?: undefined, defaultValue?: any, expectArray?: true): Record<string, UploadedFile[]>;
    public file (key: string, defaultValue?: any, expectArray?: false | undefined): UploadedFile;
    public file (key: string, defaultValue?: any, expectArray?: true): UploadedFile[];
    public file<K extends string | undefined = undefined, E extends boolean | undefined = undefined> (key?: K, defaultValue?: any, expectArray?: E) {
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
     * Get the user making the request.
     *
     * @param  guard
     */
    public user (guard?: string): U | undefined {
        return Reflect.apply(this.getUserResolver(), this, [guard])
    }

    /**
     * Get the route handling the request.
     *
     * @param  param
     * @param  defaultRoute
     */
    public route (): IRoute
    public route (param?: string, defaultParam?: any): any
    public route (param?: string, defaultParam?: any) {
        const route = Reflect.apply(this.getRouteResolver(), this, [])

        if (typeof route === 'undefined' || !param) {
            return route
        }

        return route.parameter(param, defaultParam)
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
     * Get the current decoded path info for the request.
     */
    public decodedPath () {
        try {
            return decodeURIComponent(this.path())
        } catch {
            return this.path()
        }
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
     * Determine if the request is over HTTPS.
     */
    public secure () {
        return this.isSecure()
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
     * Get an instance of the current session manager
     * 
     * @param key 
     * @param defaultValue 
     * @returns a global instance of the current session manager.
     */
    public session<K extends string | Record<string, any> | undefined = undefined> (key?: K, defaultValue?: any): K extends undefined
        ? ISessionManager
        : K extends string
        ? any : void | Promise<void> {
        this.sessionManager ??= new this.sessionManagerClass(
            this.context,
            config('session.driver', 'file'),
            {
                cwd: config('session.files'),
                sessionDir: '/',
                dir: '/',
                table: config('session.table'),
                prefix: config('database.connections.redis.options.prefix'),
                client: config(`database.connections.${config('session.driver', 'file')}.client`),
            }
        )

        if (typeof key === 'string') {
            return this.sessionManager.get(key, defaultValue)
        } else if (typeof key === 'object') {
            for (const [k, val] of Object.entries(key)) {
                this.sessionManager.put(k, val)
            }
            return undefined as any
        }

        return this.sessionManager as any
    }

    /**
     * Get the host name.
     */
    public host () {
        return this.getHost()
    }

    /**
     * Get the HTTP host being requested.
     */
    public httpHost () {
        return this.getHttpHost()
    }

    /**
     * Get the scheme and HTTP host.
     */
    public schemeAndHttpHost () {
        return this.getSchemeAndHttpHost()
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
     * Get the client IP address.
     */
    public ip (): string | undefined {
        return getRequestIP(this.event)
    }

    /**
     * Get the flashed input from previous request
     * 
     * @param key 
     * @param defaultValue 
     * @returns 
     */
    public async old (): Promise<Record<string, any>>
    public async old (key: string, defaultValue?: any): Promise<any>
    public async old (key?: string, defaultValue?: any): Promise<any> {
        const payload = await this.session().get('_old', {})

        if (key) return safeDot(payload, key) || defaultValue
        return payload
        // new MessageBag(instance.errors().all())
    }

    /**
     * Get a URI instance for the request.
     */
    public uri (): IUrl {
        const Url = Reflect.apply(this.app.getUriResolver(), this, [])!

        return Url.of(this.fullUrl(), this.app)
    }

    /**
     * Get the root URL for the application.
     *
     * @return string
     */
    public root () {
        return Str.rtrim(this.getSchemeAndHttpHost() + this.getBaseUrl(), '/')
    }

    /**
     * Get the URL (no query string) for the request.
     *
     * @return string
     */
    public url () {
        return Str.rtrim(this.uri().toString().replace(/\?.*/, ''), '/')
    }

    /**
     * Get the full URL for the request. 
     */
    public fullUrl (): string {
        return this.event.req.url
    }

    /**
     * Get the current path info for the request.
     */
    public path (): string {
        const pattern = (this.getPathInfo() ?? '').replace(/^\/+|\/+$/g, '')
        return pattern === '' ? '/' : pattern
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
     * Get the user resolver callback.
     */
    public getUserResolver (): ((gaurd?: string) => U | undefined) {
        return this.userResolver ?? (() => undefined)
    }

    /**
     * Set the user resolver callback.
     *
     * @param  callback
     */
    public setUserResolver (callback: (gaurd?: string) => U) {
        this.userResolver = callback

        return this
    }

    /**
     * Get the route resolver callback.
     */
    public getRouteResolver (): () => IRoute | undefined {
        return this.routeResolver ?? (() => undefined)
    }

    /**
     * Set the route resolver callback.
     *
     * @param  callback
     */
    public setRouteResolver (callback: () => IRoute) {
        this.routeResolver = callback

        return this
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
     * Dump the items.
     *
     * @param  keys
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
