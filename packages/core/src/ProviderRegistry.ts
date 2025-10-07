import type { Application } from './Application'
import { ContainerResolver } from '../src/Di/ContainerResolver'
import { ServiceProvider } from './ServiceProvider'
import fg from 'fast-glob'
import path from 'node:path'

type ProviderCtor = (new (_app: Application) => ServiceProvider) & Partial<ServiceProvider>

export class ProviderRegistry {
    private static providers = new Map<string, ProviderCtor>()
    private static priorityMap = new Map<string, number>()
    private static filteredProviders: string[] = []
    private static sortable = true

    /**
     * Set wether providers should be sorted or not.
     * 
     * @returns 
     */
    static setSortable (sort: boolean = true): void {
        this.sortable = sort
    }

    /**
     * Get a unique identifier for the Provider.
     * 
     * @param provider 
     * @returns 
     */
    private static getKey (provider: ProviderCtor): string {
        // If provider has a declared static uid/id → prefer that
        const anyProvider = provider as any
        if (typeof anyProvider.uid === 'string') {
            return anyProvider.uid
        }
        if (typeof anyProvider.id === 'string') {
            return anyProvider.id
        }

        // Otherwise fallback to class name + source file (if available)
        // Works for both Node.js (filename from stack) and bundlers
        return provider.name || 'AnonymousProvider'
    }

    /**
     * Register one or more providers.
     * Duplicate constructors will be ignored.
     * 
     * @param providers 
     * @returns 
     */
    static register (...providers: ProviderCtor[]): void {
        const list = this.sortable
            ? this.sort(providers.concat(...this.providers.values()))
            : providers.concat(...this.providers.values())

        for (const provider of list) {
            const key = this.getKey(provider)
            this.providers.set(key, provider)
        }
    }

    /**
     * Bulk register providers from an array.
     * 
     * @param providers 
     * @returns 
     */
    static registerMany (providers: ProviderCtor[]): void {
        const list = this.sortable
            ? this.sort(providers.concat(...this.providers.values()))
            : providers.concat(...this.providers.values())

        for (const provider of list) {
            const key = this.getKey(provider)
            this.providers.set(key, provider)
        }
    }

    /**
     * Get all registered providers as an array.
     *  
     * @returns 
     */
    static setFiltered (filtered: string[]): void {
        this.filteredProviders = filtered
    }

    /**
     * Resolve (instantiate) all providers with the given application or Service Container.
     * 
     * @param app 
     * @returns 
     */
    static async resolve (app: Application, useServiceContainer: boolean = false): Promise<ServiceProvider[]> {

        // Remove all filtered service providers 
        const providers = Array.from(this.providers.values()).filter(e => {
            return !!e && (this.filteredProviders.length < 1 || !this.filteredProviders.includes(e.name))
        })

        return await Promise.all(providers.map(async (ProviderClass) => {
            // Don't bind to the service container if we don't have to
            const provider = new ProviderClass(app)
            if (!useServiceContainer) return Promise.resolve(provider)

            // Bind to the service container
            await new ContainerResolver(app).resolveMethodParams(provider, 'register', app)
            return provider
        }))
    }

    /**
     * Sort the service providers
     * 
     * @param providers 
     * @returns 
     */
    static sort (providers: ProviderCtor[]) {
        /**
         * Base priority (default 0)
         */
        providers.forEach((Provider) => {
            const key = this.getKey(Provider)
            this.priorityMap.set(`${Provider.name}::${key}`, (Provider as any).priority ?? 0)
        })

        /**
         * Handle before/after adjustments
         */
        providers.forEach((Provider) => {
            const order = (Provider as any).order
            if (!order) return

            const [direction, target] = order.split(':')
            const targetPriority = this.priorityMap.get(target) ?? 0
            const key = this.getKey(Provider)

            if (direction === 'before') {
                this.priorityMap.set(`${Provider.name}::${key}`, targetPriority - 1)
            } else if (direction === 'after') {
                this.priorityMap.set(`${Provider.name}::${key}`, targetPriority + 1)
            }
        })

        /**
         * Return service providers sorted based on thier name and priority
         */
        return providers.sort(
            (A, B) => {
                const keyA = this.getKey(A)
                const keyB = this.getKey(B)
                return (this.priorityMap.get(`${B.name}::${keyB}`) ?? 0) - (this.priorityMap.get(`${A.name}::${keyA}`) ?? 0)
            }
        )
    }

    /**
     * Sort service providers
     */
    static doSort () {
        const raw = this.sort(Array.from(this.providers.values()))
        const providers = new Map<string, ProviderCtor>()

        for (const provider of raw) {
            const key = this.getKey(provider)
            providers.set(key, provider)
        }

        this.providers = providers
    }

    /**
     * Log the service providers in a table
     * 
     * @param priorityMap 
     */
    static log<P extends ServiceProvider> (providers?: Array<P> | Map<string, P>) {
        const sorted = Array.from(((providers as unknown as P[]) ?? this.providers).values())

        console.table(
            sorted.map((P: any) => ({
                Name: P.constructor.name,
                Order: P.constructor.order ?? 'N/A',
                Priority: P.constructor.priority,
            }))
        )

        console.info('')
    }

    /**
     * Get all registered providers as an array.
     *  
     * @returns 
     */
    static all (): ProviderCtor[] {
        return Array.from(this.providers.values())
    }

    /**
     * Check if a provider is already registered.
     * 
     * @param provider 
     * @returns 
     */
    static has (provider: ProviderCtor): boolean {
        return this.providers.has(this.getKey(provider))
    }

    public static async discoverProviders (autoRegister = true) {
        const manifests = await fg('node_modules/@h3ravel/*/package.json')

        const providers: ProviderCtor[] = []

        for (const manifestPath of manifests) {
            const pkg = await this.getManifest(path.resolve(manifestPath))
            if (pkg.h3ravel?.providers) {
                providers.push(...await Promise.all(
                    pkg.h3ravel.providers.map(
                        async (name: string) => (await import(path.resolve(path.dirname(manifestPath), 'dist/index.js')))[name]
                    )))
            }
        }

        if (autoRegister) {
            for (const provider of providers) {
                const key = this.getKey(provider)
                this.providers.set(key, provider)
            }
        }

        return providers
    }

    private static async getManifest (manifestPath: string) {
        let pkg: any
        try {
            pkg = (await import(manifestPath)).default
        } catch {
            const { createRequire } = await import('module')
            const require = createRequire(import.meta.url)
            pkg = require(manifestPath)
        }
        return pkg
    }
}
