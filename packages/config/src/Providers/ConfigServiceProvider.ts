/// <reference path="../../../core/src/app.globals.d.ts" />

import { ConfigRepository, EnvLoader } from '..'

import { Bindings } from '@h3ravel/contracts'
import { ConfigPublishCommand } from '../Commands/ConfigPublishCommand'
import { ServiceProvider } from '@h3ravel/foundation'

/**
 * Loads configuration and environment files.
 * 
 * Load .env and merge with config files.
 * Bind ConfigRepository to the container.
 * 
 * Auto-Registered
 */
export class ConfigServiceProvider extends ServiceProvider {
    public static priority = 998
    // public static order = 'before:DatabaseServiceProvider';

    async register () {
        /**
         * Create singleton to load env
         */
        this.app.singleton('env', () => {
            const env = new EnvLoader(this.app).get
            globalThis.env = env
            return env
        })

        /**
         * Initialize the configuration through the repository
         */
        const repo = new ConfigRepository(this.app)
        await repo.load()

        /**
         * Create singleton to load configurations
         */
        this.app.singleton('config', () => {
            const config = {
                get: (key, def) => repo.get(key as any, def),
                set: repo.set
            } as Bindings['config']

            globalThis.config = ((key: string | Record<string, any>, def: any) => {
                if (!key || typeof key === 'string') {
                    return config.get(key, def)
                }

                Object.entries(key).forEach(([key, value]) => {
                    config.set(key, value)
                })
            }) as never

            return config
        })

        this.app.make('http.app').use(e => {
            repo.set('app.url', e.url.origin)
        })

        this.registerCommands([ConfigPublishCommand])
    }
}
