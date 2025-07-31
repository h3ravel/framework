import { ServiceProvider } from '@h3ravel/core'

/**
 * Cache drivers and utilities.
 * 
 * Bind CacheManager.
 * Load drivers (memory, Redis).
 * Provide Cache facade.
 * 
 * Auto-Registered if @h3ravel/cache is installed.
 */
export class CacheServiceProvider extends ServiceProvider {
    register () {
        // Core bindings
    }
}
