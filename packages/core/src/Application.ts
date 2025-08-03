import { IApplication, IPathName, IServiceProvider } from '@h3ravel/shared'

import { Container } from './Container'
import { PathLoader } from './Utils/PathLoader'
import path from 'node:path'

export class Application extends Container implements IApplication {
    paths = new PathLoader()
    private booted = false
    private versions = { app: '0', ts: '0' }
    private basePath: string

    private providers: IServiceProvider[] = []
    protected externalProviders: Array<new (_app: IApplication) => IServiceProvider> = []

    constructor(basePath: string) {
        super()
        this.basePath = basePath
        this.setPath('base', basePath)
        this.loadOptions()
        this.registerBaseBindings()
    }

    /**
     * Register core bindings into the container
     */
    protected registerBaseBindings () {
        this.bind(Application, () => this)
        this.bind('path.base', () => this.basePath)
        this.bind('app.paths', () => this.paths)
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
        const app = await this.safeImport(this.getPath('base', 'package.json'))
        const core = await this.safeImport('../package.json')

        if (app && app.dependencies) {
            this.versions.app = app.dependencies['@h3ravel/core']
        }
        if (core && core.devDependencies) {
            this.versions.ts = app.devDependencies.typescript
        }
    }

    /**
     * Load default and optional providers dynamically
     * 
     * Auto-Registration Behavior
     * 
     * Minimal App: Loads only core, config, http, router by default.
     * Full-Stack App: Installs database, mail, queue, cache → they self-register via their providers.
     */
    protected async getConfiguredProviders (): Promise<Array<new (_app: IApplication) => IServiceProvider>> {
        return [
            (await this.safeImport('@h3ravel/core')).AppServiceProvider,
            (await this.safeImport('@h3ravel/http')).HttpServiceProvider,
            (await this.safeImport('@h3ravel/config')).ConfigServiceProvider,
            (await this.safeImport('@h3ravel/router')).RouteServiceProvider,
            (await this.safeImport('@h3ravel/router')).AssetsServiceProvider,
            (await this.safeImport('@h3ravel/core')).ViewServiceProvider,
            (await this.safeImport('@h3ravel/database'))?.DatabaseServiceProvider,
            (await this.safeImport('@h3ravel/cache'))?.CacheServiceProvider,
            (await this.safeImport('@h3ravel/console'))?.ConsoleServiceProvider,
            (await this.safeImport('@h3ravel/queue'))?.QueueServiceProvider,
            (await this.safeImport('@h3ravel/mail'))?.MailServiceProvider,
        ]
    }

    protected async getAllProviders (): Promise<Array<new (_app: IApplication) => IServiceProvider>> {
        const coreProviders = await this.getConfiguredProviders()
        return [...coreProviders, ...this.externalProviders]
    }

    registerProviders (providers: Array<new (_app: IApplication) => IServiceProvider>): void {
        this.externalProviders.push(...providers)
    }

    /**
     * Register a provider
     */
    public async register (provider: IServiceProvider) {
        await provider.register()
        this.providers.push(provider)
    }

    /**
     * Boot all providers after registration
     */
    public async boot () {
        if (this.booted) return

        for (const provider of this.providers) {
            if (provider.boot) {
                await provider.boot()
            }
        }

        this.booted = true
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
    getPath (name: IPathName, pth?: string) {
        return path.join(this.paths.getPath(name, this.basePath), pth ?? '')
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
        return this.versions[key]?.replaceAll(/\^|\~/g, '')
    }
}
