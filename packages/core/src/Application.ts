import 'reflect-metadata'

import { FileSystem, IApplication, IPathName, IServiceProvider, Logger } from '@h3ravel/shared'

import { Container } from './Container'
import { ContainerResolver } from './Di/ContainerResolver'
import type { H3 } from 'h3'
import { PathLoader } from '@h3ravel/shared'
import { Registerer } from './Registerer'
import chalk from 'chalk'
import { detect } from 'detect-port'
import dotenv from 'dotenv'
import dotenvExpand from 'dotenv-expand'
import path from 'node:path'
import { readFile } from 'node:fs/promises'
import semver from 'semver'

type AServiceProvider = (new (_app: Application) => IServiceProvider) & IServiceProvider

export class Application extends Container implements IApplication {
    public paths = new PathLoader()
    private tries: number = 0
    private booted = false
    private versions = { app: '0.0.0', ts: '0.0.0' }
    private basePath: string

    private providers: IServiceProvider[] = []
    protected externalProviders: Array<new (_app: Application) => IServiceProvider> = []

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

    /**
     * Dynamically register all configured providers
     */
    public async registerConfiguredProviders () {
        const providers = await this.getAllProviders()

        for (const ProviderClass of providers) {
            if (!ProviderClass) continue
            const provider = new ProviderClass(this)
            await this.register(provider)
        }
    }

    protected async loadOptions () {
        try {
            const corePath = FileSystem.findModulePkg('@h3ravel/core', process.cwd()) ?? ''
            const app = JSON.parse(await readFile(path.join(process.cwd(), '/package.json'), { encoding: 'utf8' }))
            const core = JSON.parse(await readFile(path.join(corePath, 'package.json'), { encoding: 'utf8' }))

            if (app) {
                this.versions.app = semver.minVersion(app.version)?.version ?? this.versions.app
            }
            if (core && core.devDependencies) {
                this.versions.ts = semver.minVersion(app.devDependencies.typescript)?.version ?? this.versions.ts
            }
        } catch { /** */ }//
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
            (await import('@h3ravel/core')).ViewServiceProvider,
        ]
    }

    protected async getAllProviders (): Promise<Array<AServiceProvider>> {
        const coreProviders = await this.getConfiguredProviders()
        const allProviders = [...coreProviders, ...this.externalProviders]

        /**
         * Deduplicate by class reference
         */
        const uniqueProviders = Array.from(new Set(allProviders))

        return this.sortProviders(uniqueProviders)
    }

    private sortProviders (providers: Array<AServiceProvider>) {
        const priorityMap = new Map<string, number>()

        /**
         * Base priority (default 0)
         */
        providers.forEach((Provider) => {
            priorityMap.set(Provider.name, (Provider as any).priority ?? 0)
        })

        /**
         * Handle before/after adjustments
         */
        providers.forEach((Provider) => {
            const order = (Provider as any).order
            if (!order) return

            const [direction, target] = order.split(':')
            const targetPriority = priorityMap.get(target) ?? 0

            if (direction === 'before') {
                priorityMap.set(Provider.name, targetPriority - 1)
            } else if (direction === 'after') {
                priorityMap.set(Provider.name, targetPriority + 1)
            }
        })

        /**
         * Service providers sorted based on thier name and priority
         */
        const sorted = providers.sort(
            (A, B) => (priorityMap.get(B.name) ?? 0) - (priorityMap.get(A.name) ?? 0)
        )

        /**
         * If debug is enabled, let's show the loaded service provider info
         */
        if (process.env.APP_DEBUG === 'true' && process.env.EXTENDED_DEBUG !== 'false' && !sorted.some(e => e.console)) {
            console.table(
                sorted.map((P) => ({
                    Provider: P.name,
                    Priority: priorityMap.get(P.name),
                    Order: (P as any).order || 'N/A',
                }))
            )

            console.info(`Set ${chalk.bgCyan(' APP_DEBUG = false ')} in your .env file to hide this information`, '\n')
        }

        return sorted
    }

    registerProviders (providers: Array<AServiceProvider>): void {
        this.externalProviders.push(...providers)
    }

    /**
     * Register a provider
     */
    public async register (provider: IServiceProvider) {
        await new ContainerResolver(this).resolveMethodParams(provider, 'register', this)
        if (provider.registeredCommands && provider.registeredCommands.length > 0) {
            this.registeredCommands.push(...provider.registeredCommands)
        }
        this.providers.push(provider)
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
        if (this.booted) return

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
    }

    /**
     * Fire up the developement server using the user provided arguments
     * 
     * Port will be auto assigned if provided one is not available
     * 
     * @param h3App The current H3 app instance
     * @param preferedPort If provided, this will overide the port set in the evironment
     */
    public async fire (h3App: H3, preferedPort?: number) {
        const serve = this.make('http.serve')

        const port: number = preferedPort ?? env('PORT', 3000)
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
    }

    /**
     * Attempt to dynamically import an optional module
     */
    private async safeImport (moduleName: string) {
        try {
            const mod = await import(moduleName)
            return mod.default ?? mod ?? {}
        } catch {
            return null
        }
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
    getVersion (key: 'app' | 'ts') {
        return this.versions[key]?.replaceAll(/\^|~/g, '')
    }
}
