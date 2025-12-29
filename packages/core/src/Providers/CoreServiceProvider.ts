import 'reflect-metadata'

import { Application } from '..'
import { IApplication } from '@h3ravel/contracts'
import { ServiceProvider } from '../ServiceProvider'
import { str } from '@h3ravel/support'

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
    public static priority = 999

    register () {
        Object.assign(globalThis, {
            str,
        })

        this.app.alias(IApplication, Application)
    }

    boot (): void | Promise<void> {
        try {
            Object.assign(globalThis, {
                asset: this.app.make('asset'),
            })
        } catch {/** */ }
    }
}
