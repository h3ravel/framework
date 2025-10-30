import 'reflect-metadata'

import { ServiceProvider } from '@h3ravel/core'

/**
 * Bootstraps your services and bindings.
 * 
 */
export class AppServiceProvider extends ServiceProvider {
    public static priority = 800

    register () {
        // Register bindings to the container. Runs before boot().
        // console.log(public_path())
    }

    boot () {
        // Perform post-registration booting of services. Runs after all providers have been registered.
    }
}
