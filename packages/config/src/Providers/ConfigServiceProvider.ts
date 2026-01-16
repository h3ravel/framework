/// <reference path="../../../foundation/src/app.globals.d.ts" />

import { ConfigRepository, EnvLoader } from '..'

import { ConfigPublishCommand } from '../Commands/ConfigPublishCommand'
import { ServiceProvider } from '@h3ravel/support'

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
            globalThis.env ??= env
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
            return repo
        })

        this.app.make('http.app').use(e => {
            repo.set('app.url', e.url.origin)
        })

        this.registerCommands([ConfigPublishCommand])
    }
}
