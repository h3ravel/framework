import 'reflect-metadata'

import { FileSystem, IApplication, IPathName, Logger } from '@h3ravel/shared'
import { InvalidArgumentException, Str } from '@h3ravel/support'

import { AServiceProvider } from './Contracts/ServiceProviderConstructor'
import { Container } from './Container'
import { ContainerResolver } from './Di/ContainerResolver'
import type { H3 } from 'h3'
import { PathLoader } from '@h3ravel/shared'
import { ProviderRegistry } from './ProviderRegistry'
import { Registerer } from './Registerer'
import { ServiceProvider } from './ServiceProvider'
import { detect } from 'detect-port'
import dotenv from 'dotenv'
import dotenvExpand from 'dotenv-expand'
import path from 'node:path'
import { readFile } from 'node:fs/promises'
import semver from 'semver'

export class Application extends Container implements IApplication {
    public paths = new PathLoader()
    private tries: number = 0
    private booted = false
    private basePath: string
    private versions: { [key: string]: string, app: string, ts: string } = { app: '0.0.0', ts: '0.0.0' }
    private static versions: { [key: string]: string, app: string, ts: string } = { app: '0.0.0', ts: '0.0.0' }

    private providers: Array<ServiceProvider> = []
    protected externalProviders: Array<AServiceProvider> = []
    protected filteredProviders: Array<string> = []

    /**
     * List of registered console commands
     */
    public registeredCommands: (new (app: any, kernel: any) => any)[] = []

    constructor(basePath: string) {
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
    public getRegisteredProviders () {
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
    protected async getConfiguredProviders (): Promise<Array<AServiceProvider>> {
        return [
            (await import('@h3ravel/core')).CoreServiceProvider,
        ]
    }

    protected async getAllProviders (): Promise<Array<AServiceProvider>> {
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
    public async quickStartup (providers: Array<AServiceProvider>, filtered: string[] = [], autoRegisterProviders = true) {
        this.registerProviders(providers, filtered)
        await this.registerConfiguredProviders(autoRegisterProviders)
        return this.boot()
    }

    /**
     * Dynamically register all configured providers
     * 
     * @param autoRegister If set to false, service providers will not be auto discovered and registered.
     */
    public async registerConfiguredProviders (autoRegister = true) {
        const providers = await this.getAllProviders()

        ProviderRegistry.setSortable(false)
        ProviderRegistry.setFiltered(this.filteredProviders)
        ProviderRegistry.registerMany(providers)

        if (autoRegister) {
            await ProviderRegistry.discoverProviders(autoRegister)
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
    registerProviders (providers: Array<AServiceProvider>, filtered: string[] = []): void {
        this.externalProviders.push(...providers)
        this.filteredProviders = filtered
    }

    /**
     * Register a provider
     */
    public async register (provider: ServiceProvider) {
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
    public withCommands (commands: (new (app: any, kernel: any) => any)[]) {
        this.registeredCommands = commands

        return this
    }

    /**
     * checks if the application is running in CLI
     */
    public runningInConsole (): boolean {
        return typeof process !== 'undefined'
            && !!process.stdout
            && !!process.stdin

    }

    public getRuntimeEnv (): 'browser' | 'node' | 'unknown' {
        if (typeof window !== 'undefined' && typeof document !== 'undefined') {
            return 'browser'
        }
        if (typeof process !== 'undefined' && process.versions?.node) {
            return 'node'
        }
        return 'unknown'
    }

    /**
     * Boot all service providers after registration
     */
    public async boot () {

        if (this.booted) return this

        /**
         * If debug is enabled, let's show the loaded service provider info
         */
        if (((process.env.APP_DEBUG === 'true' && process.env.EXTENDED_DEBUG !== 'false') || Number(process.env.VERBOSE) > 1) &&
            !this.providers.some(e => e.runsInConsole)
        ) {
            ProviderRegistry.log(this.providers)
        }

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
            }
        }

        this.booted = true
        return this
    }

    /**
     * Fire up the developement server using the user provided arguments
     * 
     * Port will be auto assigned if provided one is not available
     * 
     * @param h3App The current H3 app instance
     * @param preferedPort If provided, this will overide the port set in the evironment
     */
    public async fire (): Promise<this>
    public async fire (h3App: H3, preferredPort?: number): Promise<this>
    public async fire (h3App?: H3, preferredPort?: number): Promise<this> {
        if (!h3App) {
            throw new InvalidArgumentException('No valid H3 app instance was provided.')

        }

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
