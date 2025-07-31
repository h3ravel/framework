import { Container } from './Container'
import { ServiceProvider } from './ServiceProvider'

export class Application extends Container {
    private providers: ServiceProvider[] = []
    private basePath: string
    private booted = false

    constructor(basePath: string) {
        super()
        this.basePath = basePath
        this.registerBaseBindings()
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
        const providers = await this.getConfiguredProviders()

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
            (await import('@h3ravel/router')).RouteServiceProvider,

            await this.safeImport('@h3ravel/database').then(m => m?.DatabaseServiceProvider),
            await this.safeImport('@h3ravel/cache').then(m => m?.CacheServiceProvider),
            await this.safeImport('@h3ravel/mail').then(m => m?.MailServiceProvider),
            await this.safeImport('@h3ravel/queue').then(m => m?.QueueServiceProvider),
            await this.safeImport('@h3ravel/console').then(m => m?.ConsoleServiceProvider)
        ].filter(Boolean) as Array<new (_app: Application) => ServiceProvider>
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
