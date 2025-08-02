import { Container } from './Container'
import { PathLoader } from './Utils/PathLoader'
import { ServiceProvider } from './ServiceProvider'
import path from 'node:path'

export class Application extends Container {
    paths = new PathLoader()
    private booted = false
    private basePath: string

    private providers: ServiceProvider[] = []
    protected externalProviders: Array<new (_app: Application) => ServiceProvider> = []

    constructor(basePath: string) {
        super()
        this.basePath = basePath
        this.setPath('base', basePath)
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

    /**
     * Load default and optional providers dynamically
     * 
     * Auto-Registration Behavior
     * 
     * Minimal App: Loads only core, config, http, router by default.
     * Full-Stack App: Installs database, mail, queue, cache → they self-register via their providers.
     */
    protected async getConfiguredProviders (): Promise<Array<new (_app: Application) => ServiceProvider>> {
        return [
            (await import('@h3ravel/core')).AppServiceProvider,
            (await import('@h3ravel/http')).HttpServiceProvider,
            (await import('@h3ravel/config')).ConfigServiceProvider,
            (await import('@h3ravel/router')).RouteServiceProvider,
            (await import('@h3ravel/router')).AssetsServiceProvider,
            (await import('@h3ravel/core')).ViewServiceProvider,
        ]
    }

    protected async getAllProviders (): Promise<Array<new (_app: Application) => ServiceProvider>> {
        const coreProviders = await this.getConfiguredProviders()
        return [...coreProviders, ...this.externalProviders]
    }

    registerProviders (providers: Array<new (_app: Application) => ServiceProvider>): void {
        this.externalProviders.push(...providers)
    }

    /**
     * Register a provider
     */
    public async register (provider: ServiceProvider) {
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
            return mod.default
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
    getPath (name: Parameters<PathLoader['setPath']>[0], pth?: string) {
        return path.join(this.paths.getPath(name, this.basePath), pth ?? '')
    }

    /**
     * Programatically set the paths.
     *
     * @param name - The base name of the path property
     * @param path - The new path
     * @returns 
     */
    setPath (name: Parameters<PathLoader['setPath']>[0], path: string) {
        return this.paths.setPath(name, path, this.basePath)
    }
}
