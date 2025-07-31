import { Application } from './Application'

export abstract class ServiceProvider {
    protected app: Application

    constructor(app: Application) {
        this.app = app
    }

    /**
     * Register bindings to the container.
     * Runs before boot().
     */
    abstract register (): void | Promise<void>

    /**
     * Perform post-registration booting of services.
     * Runs after all providers have been registered.
     */
    boot?(): void | Promise<void>
}
