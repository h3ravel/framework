import { ServiceProvider } from '@h3ravel/core'

/**
 * Loads configuration and environment files.
 * 
 * Load .env and merge with config files.
 * Bind ConfigRepository to the container.
 * 
 * Auto-Registered
 */
export class ConfigServiceProvider extends ServiceProvider {
    register () {
        this.app.singleton('config', () => {
            return {
                get: (key: string) => process.env[key] ?? null
            }
        })
    }
}
