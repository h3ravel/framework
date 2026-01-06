import { ConcreteConstructor, IServiceProvider } from '@h3ravel/contracts'

import type { Application } from './Application'
import { ContainerResolver } from '../src/Manager/ContainerResolver'
import { createRequire } from 'node:module'
import fg from 'fast-glob'
import path from 'node:path'

export class ProviderRegistry {
    private static providers = new Map<string, ConcreteConstructor<IServiceProvider, false>>()
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
    private static getKey (provider: ConcreteConstructor<IServiceProvider, false>): string {
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
    static register (...providers: ConcreteConstructor<IServiceProvider, false>[]): void {
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
    static registerMany (providers: ConcreteConstructor<IServiceProvider, false>[]): void {
        const list = this.sortable
            ? this.sort(providers.concat(...this.providers.values()))
            : providers.concat(...this.providers.values())

        for (const provider of list) {
            const key = this.getKey(provider)
            this.providers.set(key, provider)
        }
    }

    /**
     * Set the filtered providers.
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
    static async resolve (app: Application, useServiceContainer: boolean = false): Promise<IServiceProvider[]> {

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
    static sort (providers: ConcreteConstructor<IServiceProvider, false>[]) {
        const makeKey = (Provider: ConcreteConstructor<IServiceProvider, false>) => `${Provider.name}::${this.getKey(Provider)}`

        // Step 1: Sort purely by priority (descending)
        providers.sort((A, B) => ((B as any).priority ?? 0) - ((A as any).priority ?? 0))

        // Step 2: Apply order overrides ("before:" / "after:")
        const findIndex = (target: string) => {
            if (target.includes('::')) {
                return providers.findIndex(p => makeKey(p) === target)
            }
            return providers.findIndex(p => p.name === target)
        }

        providers.forEach((Provider) => {
            const order = (Provider as any).order
            if (!order) return

            const [direction, rawTarget] = order.split(':')
            const targetIndex = findIndex(rawTarget)
            if (targetIndex === -1) return

            const currentIndex = providers.indexOf(Provider)
            if (currentIndex === -1) return

            // Remove and reinsert at correct spot
            providers.splice(currentIndex, 1)
            const insertIndex = direction === 'before'
                ? targetIndex
                : targetIndex + 1

            providers.splice(insertIndex, 0, Provider)
        })

        return providers
    }


    /**
     * Sort service providers
     */
    static doSort () {
        const raw = this.sort(Array.from(this.providers.values()))
        const providers = new Map<string, ConcreteConstructor<IServiceProvider, false>>()

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
    static log<P extends IServiceProvider> (providers?: Array<P> | Map<string, P>, enabled = true) {
        if (!enabled) return

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
    static all (): ConcreteConstructor<IServiceProvider, false>[] {
        return Array.from(this.providers.values())
    }

    /**
     * Check if a provider is already registered.
     * 
     * @param provider 
     * @returns 
     */
    static has (provider: ConcreteConstructor<IServiceProvider, false>): boolean {
        return this.providers.has(this.getKey(provider))
    }

    /**
     * Automatically search for and discover service providers in packages.
     * 
     * @param autoRegister 
     * @returns 
     */
    public static async discoverProviders (autoRegister = true) {
        const manifests = await fg([
            'node_modules/@h3ravel/*/package.json',
            'node_modules/@h3ravel-community/*/package.json',
            'node_modules/h3ravel-*/package.json',
        ])

        const providers: ConcreteConstructor<IServiceProvider, false>[] = []

        if (autoRegister) {
            for (const manifestPath of manifests) {
                const pkg = this.getManifest(path.resolve(manifestPath))

                if (pkg.h3ravel?.providers) {
                    providers.push(...await Promise.all(
                        pkg.h3ravel.providers.map(
                            async (name: string) => (await import(path.resolve(path.dirname(manifestPath), 'dist/index.js')))[name]
                        )))
                }
            }

            for (const provider of providers.filter(e => typeof e !== 'undefined')) {
                const key = this.getKey(provider)
                this.providers.set(key, provider)
            }
        }

        return providers
    }

    /**
     * Get the content of the package.json file
     * 
     * @param manifestPath 
     * @returns 
     */
    private static getManifest (manifestPath: string) {
        const require = createRequire(import.meta.url)
        return require(manifestPath)
    }
}
