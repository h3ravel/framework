import { Container } from './Container'
import { ServiceProvider } from './ServiceProvider'

export class Application extends Container {
    private providers: ServiceProvider[] = []
    private basePath: string
    private booted = false
    protected externalProviders: Array<new (_app: Application) => ServiceProvider> = []

    constructor(basePath: string) {
        super()
        this.basePath = basePath
        // this.registerBaseBindings()
    }

    /**
     * Register core bindings into the container
     */
    protected registerBaseBindings () {
        this.bind(Application, () => this)
        this.bind('path.base', () => this.basePath)
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
            (await import('@h3ravel/config')).ConfigServiceProvider,
            (await import('@h3ravel/http')).HttpServiceProvider,
            (await import('@h3ravel/router')).RouteServiceProvider
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
}
