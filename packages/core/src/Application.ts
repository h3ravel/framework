import 'reflect-metadata'

import { FileSystem, Logger, PathLoader } from '@h3ravel/shared'
import { H3, serve, type H3Event } from 'h3'

import { IResponse, IUrl, type IApplication, type IHttpContext, type IPathName, type IServiceProvider } from '@h3ravel/contracts'
import { CKernel, ConcreteConstructor, GenericObject, IBootstraper, IKernel, IResponsable } from '@h3ravel/contracts'
import { data_get, InvalidArgumentException, RuntimeException, Str } from '@h3ravel/support'

import { AppBuilder, ConfigException, HttpException, NotFoundHttpException, ResponseCodes } from '@h3ravel/foundation'
import { Container } from './Container'
import { ContainerResolver } from './Manager/ContainerResolver'
import { ProviderRegistry } from './ProviderRegistry'
import { Registerer } from './Registerer'
import { detect } from 'detect-port'
import dotenv from 'dotenv'
import dotenvExpand from 'dotenv-expand'
import path from 'node:path'
import { readFile } from 'node:fs/promises'
import semver from 'semver'
import { CoreServiceProvider } from './Providers/CoreServiceProvider'
import { EntryConfig } from './Contracts/H3ravelContract'
import { createRequire } from 'node:module'

export class Application extends Container implements IApplication {
    /**
     * Indicates if the application has "booted".
     */
    #booted = false
    paths = new PathLoader()
    context?: (event: H3Event) => Promise<IHttpContext>
    h3Event?: H3Event
    private tries: number = 0
    private basePath: string
    private versions: { [key: string]: string, app: string, ts: string } = { app: '0.0.0', ts: '0.0.0' }
    private namespace?: string
    private static versions: { [key: string]: string, app: string, ts: string } = { app: '0.0.0', ts: '0.0.0' }

    private h3App?: H3
    private providers: Array<IServiceProvider> = []
    protected externalProviders: Array<ConcreteConstructor<IServiceProvider, false>> = []
    protected filteredProviders: Array<string> = []
    private autoRegisterProviders: boolean = false

    /**
     * The route resolver callback.
     */
    protected uriResolver?: () => typeof IUrl

    /**
     * List of registered console commands
     */
    registeredCommands: (new (app: any, kernel: any) => any)[] = []

    /**
     * The array of booted callbacks.
     */
    protected bootedCallbacks: Array<(app: this) => void> = []

    /**
     * The array of booting callbacks.
     */
    protected bootingCallbacks: Array<(app: this) => void> = []

    /**
     * The array of terminating callbacks.
     */
    protected terminatingCallbacks: Array<(app: this) => void> = []

    /**
     * Indicates if the application has been bootstrapped before.
     */
    protected bootstrapped = false

    /**
     * Controls logging
     */
    private logsDisabled = false

    /**
     * The conrrent HttpContext
     */
    private httpContext?: IHttpContext

    constructor(basePath: string, protected initializer?: string) {
        super()
        dotenvExpand.expand(dotenv.config({ quiet: true }))

        this.basePath = basePath
        this.setPath('base', basePath)
        this.loadOptions()
        this.registerBaseBindings()
        Registerer.register(this)
    }

    /**
     * Register core bindings into the container
     */
    protected registerBaseBindings () {
        Application.setInstance(this)
        this.bind(Application, () => this)
        this.bind('path.base', () => this.basePath)
        this.bind('load.paths', () => this.paths)
    }

    protected async loadOptions () {
        try {
            const corePath = FileSystem.findModulePkg('@h3ravel/core', process.cwd()) ?? ''
            const app = JSON.parse(await readFile(path.join(process.cwd(), '/package.json'), { encoding: 'utf8' }))
            const core = JSON.parse(await readFile(path.join(corePath, 'package.json'), { encoding: 'utf8' }))

            if (core) {
                this.versions.app = semver.minVersion(core.version)?.version ?? this.versions.app
                Application.versions.app = this.versions.app
            }
            if (app && app.devDependencies) {
                this.versions.ts = semver.minVersion(app.devDependencies.typescript)?.version ?? this.versions.ts
                Application.versions.ts = this.versions.ts
            }
            if (app && app.dependencies) {
                const versions = Object.fromEntries(Object.entries(app.dependencies)
                    .filter(([e]) => e.includes('@h3ravel'))
                    .map(([name, ver]: [string, any]) => [
                        Str.afterLast(name, '/'),
                        semver.minVersion(ver.includes('work') ? this.versions.app : ver)?.version
                    ]))

                Object.assign(this.versions, versions)
                Object.assign(Application.versions, versions)
            }
        } catch { /** */ }
    }

    /**
     * Get all registered providers
     */
    getRegisteredProviders (): IServiceProvider[] {
        return this.providers
    }

    /**
     * Load default and optional providers dynamically
     * 
     * Auto-Registration Behavior
     * 
     * Minimal App: Loads only core, config, http, router by default.
     * Full-Stack App: Installs database, mail, queue, cache → they self-register via their providers.
     */
    protected async getConfiguredProviders (): Promise<ConcreteConstructor<IServiceProvider, false>[]> {
        return [
            CoreServiceProvider
        ]
    }

    protected async getAllProviders (): Promise<Array<ConcreteConstructor<IServiceProvider, false>>> {
        const coreProviders = await this.getConfiguredProviders()
        return [...coreProviders, ...this.externalProviders]
    }

    /**
     * Configure and Dynamically register all configured service providers, then boot the app.
     * 
     * @param providers All regitererable service providers
     * @param filtered A list of service provider name strings we do not want to register at all cost
     * @param autoRegisterProviders If set to false, service providers will not be auto discovered and registered.
     * 
     * @returns 
     */
    initialize (providers: Array<ConcreteConstructor<IServiceProvider, false>>, filtered: string[] = [], autoRegisterProviders = true) {
        /**
         * Bind HTTP APP to the service container
         */
        this.singleton('http.app', () => {
            return new H3()
        })

        /**
         * Bind the HTTP server to the service container
         */
        this.singleton('http.serve', () => serve)

        this.registerProviders(providers, filtered)
        this.autoRegisterProviders = autoRegisterProviders
        return this
    }

    /**
     * Dynamically register all configured providers
     */
    async registerConfiguredProviders () {
        const providers = await this.getAllProviders()
        ProviderRegistry.setSortable(false)
        ProviderRegistry.setFiltered(this.filteredProviders)
        ProviderRegistry.registerMany(providers)

        if (this.autoRegisterProviders) {
            await ProviderRegistry.discoverProviders(this.autoRegisterProviders)
        }

        ProviderRegistry.doSort()
        for (const ProviderClass of ProviderRegistry.all()) {
            if (!ProviderClass) continue
            const provider = new ProviderClass(this)
            await this.register(provider)
        }
    }

    /**
     * Register service providers
     * 
     * @param providers 
     * @param filtered 
     */
    registerProviders (providers: Array<ConcreteConstructor<IServiceProvider, false>>, filtered: string[] = []): void {
        this.externalProviders.push(...providers)
        this.filteredProviders = Array.from(new Set(this.filteredProviders.concat(filtered)))
    }

    /**
     * Register a provider
     */
    async register (provider: IServiceProvider) {
        await new ContainerResolver(this).resolveMethodParams(provider, 'register', this)
        if (provider.registeredCommands && provider.registeredCommands.length > 0) {
            this.registeredCommands.push(...provider.registeredCommands)
        }
        this.providers.push(provider)
    }

    /**
     * Register the listed service providers.
     * 
     * @param commands An array of console commands to register.
     */
    withCommands (commands: (new (app: any, kernel: any) => any)[]) {
        this.registeredCommands = commands

        return this
    }

    /**
     * checks if the application is running in CLI
     */
    runningInConsole (): boolean {
        return typeof process !== 'undefined'
            && !!process.stdout
            && !!process.stdin

    }

    /**
     * checks if the application is running in Unit Test
     */
    runningUnitTests (): boolean {
        return process.env.VITEST === 'true'
    }

    getRuntimeEnv (): 'browser' | 'node' | 'unknown' {
        if (typeof window !== 'undefined' && typeof document !== 'undefined') {
            return 'browser'
        }
        if (typeof process !== 'undefined' && process.versions?.node) {
            return 'node'
        }
        return 'unknown'
    }

    /**
     * Determine if the application has booted.
     */
    isBooted (): boolean {
        return this.#booted
    }

    /**
     * Determine if the application has booted.
     */
    logging (logging: boolean = true): this {
        this.logsDisabled = !logging
        return this
    }

    protected logsEnabled () {
        if (this.logsDisabled) return false

        const debuggable = process.env.APP_DEBUG === 'true' && process.env.EXTENDED_DEBUG !== 'false'

        return (debuggable || Number(process.env.VERBOSE) > 1) && !this.providers.some(e => e.runsInConsole)
    }

    /**
     * Boot all service providers after registration
     */
    async boot () {

        if (this.#booted) return this

        this.fireAppCallbacks(this.bootingCallbacks)

        /**
         * Register all the configured service providers
         */
        await this.registerConfiguredProviders()

        /**
         * If debug is enabled, let's show the loaded service provider info
         */
        ProviderRegistry.log(this.providers, this.logsEnabled())

        for (const provider of this.providers) {
            if (provider.boot) {
                if (Container.hasAnyDecorator(provider.boot)) {
                    /**
                     * If the service provider is decorated use the IoC container
                     */
                    await this.make<any>(provider.boot)
                } else {
                    /**
                     * Otherwise instantiate manually so that we can at least
                     * pass the app instance
                     */
                    await provider.boot(this)
                }

                if (provider.callBootedCallbacks) {
                    await provider.callBootedCallbacks()
                }
            }
        }

        this.#booted = true

        this.fireAppCallbacks(this.bootedCallbacks)

        return this
    }

    /**
     * Register a new boot listener.
     *
     * @param  callable  $callback
     */
    booting (callback: (app: this) => void): void {
        this.bootingCallbacks.push(callback)
    }

    /**
     * Register a new "booted" listener.
     *
     * @param callback
     */
    booted (callback: (app: this) => void): void {
        this.bootedCallbacks.push(callback)

        if (this.isBooted()) {
            callback(this)
        }
    }

    /**
     * Throw an HttpException with the given data.
     *
     * @param  code
     * @param  message
     * @param  headers
     *
     * @throws {HttpException}
     * @throws {NotFoundHttpException}
     */
    abort (code: ResponseCodes, message = '', headers: GenericObject = {}): void {
        if (code == 404) {
            throw new NotFoundHttpException(message, undefined, 0, headers)
        }

        throw new HttpException(code, message, undefined, headers)
    }

    /**
     * Register a terminating callback with the application.
     *
     * @param  callback
     */
    terminating (callback: (app: this) => void): this {
        this.terminatingCallbacks.push(callback)

        return this
    }

    /**
     * Terminate the application.
     */
    terminate (): void {
        let index = 0

        while (index < this.terminatingCallbacks.length) {
            this.call(this.terminatingCallbacks[index])

            index++
        }
    }

    /**
     * Call the booting callbacks for the application.
     *
     * @param  callbacks
     */
    protected fireAppCallbacks (callbacks: Array<(app: this) => void>): void {
        let index = 0

        while (index < callbacks.length) {
            callbacks[index](this)

            index++
        }
    }

    /**
     * Handle the incoming HTTP request and send the response to the browser.
     *
     * @param  config  Configuration option to pass to the initializer
     */
    async handleRequest (config?: EntryConfig): Promise<void> {
        this.h3App?.all('/**', async (event) => {
            // Define app context factory
            this.context = (event) => this.buildContext(event, config)

            this.h3Event = event

            const context = await this.context!(event)

            const kernel = this.make(IKernel)

            this.bind('http.context', () => context)
            this.bind('http.request', () => context.request)
            this.bind('http.response', () => context.response)

            const response = await kernel.handle(context.request)

            if (response) this.bind('http.response', () => response)

            kernel.terminate(context.request, response!)

            let finalResponse: IResponse | IResponsable | undefined

            if (response && ['Response', 'JsonResponse'].includes(response.constructor.name)) {
                finalResponse = response.prepare(context.request).send()
            } else {
                finalResponse = response
            }

            return finalResponse
        })
    }

    /**
     * Build the http context
     * 
     * @param event 
     * @param config 
     * @returns 
     */
    async buildContext (event: H3Event, config?: EntryConfig, fresh = false): Promise<IHttpContext> {
        const { HttpContext, Request, Response } = await import('@h3ravel/http')

        event = config?.h3Event ?? event

        // If we’ve already attached the context to this event, reuse it
        if (!fresh && (event as any)._h3ravelContext)
            return (event as any)._h3ravelContext

        Request.enableHttpMethodParameterOverride()
        const ctx = HttpContext.init({
            app: this,
            request: await Request.create(event, this),
            response: new Response(this, event),
        }, event);

        (event as any)._h3ravelContext = ctx
        return ctx
    }

    /**
     * Handle the incoming Artisan command.
     */
    async handleCommand () {
        const kernel = this.make(CKernel)

        const status = await kernel.handle()

        kernel.terminate(status)

        return status
    }

    /**
     * Get the URI resolver callback.
     */
    getUriResolver (): () => typeof IUrl | undefined {
        return this.uriResolver ?? (() => undefined)
    }

    /**
     * Set the URI resolver callback.
     *
     * @param  callback
     */
    setUriResolver (callback: () => typeof IUrl) {
        this.uriResolver = callback

        return this
    }

    /**
     * Determine if middleware has been disabled for the application.
     */
    shouldSkipMiddleware () {
        return this.bound('middleware.disable') && this.make('middleware.disable') === true
    }

    /**
     * Provide safe overides for the app
     */
    configure (): AppBuilder {
        return new AppBuilder(this)
            .withKernels()
            .withCommands()
    }

    /**
     * Check if the current application environment matches the one provided
     */
    environment<E = string | undefined> (env: E): E extends undefined ? string : boolean {
        return (this.make('config').get('app.env') === env) as never
    }

    /**
     * Fire up the developement server using the user provided arguments
     * 
     * Port will be auto assigned if provided one is not available
     * 
     * @param h3App The current H3 app instance
     * @param preferedPort If provided, this will overide the port set in the evironment
     * @alias serve
     */
    async fire (): Promise<this>
    async fire (h3App: H3, preferredPort?: number): Promise<this>
    async fire (h3App?: H3, preferredPort?: number): Promise<this> {

        if (h3App)
            this.h3App = h3App

        if (!this?.h3App)
            throw new ConfigException('[Provide a H3 app instance in the config or install @h3ravel/http]')

        return await this.serve(this.h3App, preferredPort)
    }


    /**
     * Fire up the developement server using the user provided arguments
     * 
     * Port will be auto assigned if provided one is not available
     * 
     * @param h3App The current H3 app instance
     * @param preferedPort If provided, this will overide the port set in the evironment
     */
    async serve (h3App?: H3, preferredPort?: number): Promise<this> {
        if (!h3App) {
            throw new InvalidArgumentException('No valid H3 app instance was provided.')

        }

        // Boot the application service providers and other requirements
        await this.boot()

        const serve = this.make('http.serve')

        const port: number = preferredPort ?? env('PORT', 3000)
        const tries: number = env('RETRIES', 1)
        const hostname: string = env('HOSTNAME', 'localhost')

        try {
            const realPort = await detect(port)

            if (port == realPort) {
                const server = serve(h3App, {
                    port,
                    hostname,
                    silent: true,
                })

                Logger.parse([
                    ['🚀 H3ravel running at:', 'green'],
                    [`${server.options.protocol ?? 'http'}://${server.options.hostname}:${server.options.port}`, 'cyan']]
                )
            } else if (this.tries <= tries) {
                await this.fire(h3App, realPort)
                this.tries++
            } else {
                Logger.parse([
                    ['ERROR:', 'bgRed'],
                    ['No free port available', 'red'],
                ])
            }
        } catch (e: any) {
            Logger.parse([
                ['An error occured', 'bgRed'],
                [e.message, 'red'],
                [e.stack, 'red']
            ], '\n')
        }

        return this
    }

    /**
     * Run the given array of bootstrap classes.
     *
     * @param bootstrappers
     */
    async bootstrapWith (bootstrappers: ConcreteConstructor<IBootstraper>[]): Promise<void> {
        this.bootstrapped = true

        for (const bootstrapper of bootstrappers) {
            if (this.has('app.events'))
                this.make('app.events').dispatch('bootstrapping: ' + bootstrapper.name, [this])

            await this.make(bootstrapper).bootstrap(this)

            if (this.has('app.events'))
                this.make('app.events').dispatch('bootstrapped: ' + bootstrapper.name, [this])
        }
    }

    /**
     * Determine if the application has been bootstrapped before.
     */
    hasBeenBootstrapped (): boolean {
        return this.bootstrapped
    }

    /**
     * Save the curretn H3 instance for possible future use.
     *
     * @param h3App The current H3 app instance
     * @returns 
     */
    setH3App (h3App?: H3) {
        this.h3App = h3App
        return this
    }

    /**
     * Set the HttpContext.
     *
     * @param  ctx
     */
    setHttpContext (ctx: IHttpContext): this {
        this.httpContext = ctx

        return this
    }

    /**
     * Get the HttpContext.
     */
    getHttpContext (): IHttpContext | undefined
    /**
     * @param key 
     */
    getHttpContext<K extends keyof IHttpContext> (key: K): IHttpContext[K]
    getHttpContext (key?: keyof IHttpContext): any {
        return key ? this.httpContext?.[key] : this.httpContext
    }

    /**
     * Get the application namespace.
     *
     * @throws {RuntimeException}
     */
    getNamespace (): string {
        if (this.namespace != null) {
            return this.namespace
        }

        const require = createRequire(import.meta.url)

        const pkg = require(path.join(process.cwd(), 'package.json'))
        for (const [namespace, pathChoice] of Object.entries(data_get(pkg, 'autoload.namespaces'))) {

            if (this.getPath('app', '/') === this.getPath('src', pathChoice as never)) {
                return this.namespace = namespace
            }
        }

        throw new RuntimeException('Unable to detect application namespace.')
    }

    /**
     * Get the path of the app dir
     * 
     * @returns 
     */
    path (): string {
        return this.getPath('app')
    }

    /**
     * Get the base path of the app
     * 
     * @returns 
     */
    getBasePath (): string {
        return this.basePath
    }

    /**
     * Dynamically retrieves a path property from the class.
     * Any property ending with "Path" is accessible automatically.
     *
     * @param name - The base name of the path property
     * @returns 
     */
    getPath (name: IPathName, suffix?: string) {
        return path.join(this.paths.getPath(name, this.basePath), suffix ?? '')
    }

    /**
     * Programatically set the paths.
     *
     * @param name - The base name of the path property
     * @param path - The new path
     * @returns 
     */
    setPath (name: IPathName, path: string) {
        return this.paths.setPath(name, path, this.basePath)
    }

    /**
     * Returns the installed version of the system core and typescript.
     *
     * @returns 
     */
    getVersion (key: string) {
        return this.versions[key]?.replaceAll(/\^|~/g, '')
    }

    /**
     * Returns the installed version of the system core and typescript.
     *
     * @returns 
     */
    static getVersion (key: string) {
        return this.versions[key]?.replaceAll(/\^|~/g, '')
    }
}
