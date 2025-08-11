import 'reflect-metadata'

import { ServiceProvider } from '../ServiceProvider'

/**
 * Bootstraps core services and bindings.
 * 
 * Bind essential services to the container (logger, config repository).
 * Register app-level singletons.
 * Set up exception handling.
 * 
 * Auto-Registered
 */
export class CoreServiceProvider extends ServiceProvider {
    public static priority = 999;

    register () {
        // Core bindings
    }
}
