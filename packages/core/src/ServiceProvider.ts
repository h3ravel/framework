import { Application } from './Application'
import { IServiceProvider } from '@h3ravel/shared'

export abstract class ServiceProvider implements IServiceProvider {
    public static order?: `before:${string}` | `after:${string}` | string | undefined;
    public static priority = 0;
    protected app: Application

    constructor(app: Application) {
        this.app = app
    }

    /**
     * Register bindings to the container.
     * Runs before boot().
     */
    abstract register (...app: unknown[]): void | Promise<void>;

    /**
     * Perform post-registration booting of services.
     * Runs after all providers have been registered.
     */
    boot?(...app: unknown[]): void | Promise<void>;
}
