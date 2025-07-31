import { ServiceProvider } from '@h3ravel/core'

/**
 * Queues and workers.
 * 
 * Register QueueManager.
 * Load drivers (Redis, in-memory).
 * Register job dispatcher and workers.
 * 
 * Auto-Registered if @h3ravel/queue is installed
 */
export class QueueServiceProvider extends ServiceProvider {
    register () {
        // Core bindings
    }
}
