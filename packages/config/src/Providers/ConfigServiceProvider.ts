import { Bindings, ServiceProvider } from '@h3ravel/core'
import { ConfigRepository, EnvLoader } from '..'

/**
 * Loads configuration and environment files.
 * 
 * Load .env and merge with config files.
 * Bind ConfigRepository to the container.
 * 
 * Auto-Registered
 */
export class ConfigServiceProvider extends ServiceProvider {
    async register () {

        (await import('dotenv')).config({ quiet: true })

        /**
         * Create singleton to load env
         */
        this.app.singleton('env', () => {
            return new EnvLoader(this.app).get
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
            return {
                get: (key, def) => repo.get(key as any, def),
                set: repo.set
            } as Bindings['config']
        })

        this.app.make('http.app').use(e => {
            repo.set('app.url', e.url.origin)
        })
    }
}
