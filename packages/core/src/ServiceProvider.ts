import { Application } from './Application'
import { IServiceProvider } from '@h3ravel/shared'

const Inference = class { } as { new(): IServiceProvider }

export abstract class ServiceProvider extends Inference {
    /**
     * The current app instance
     */
    protected app: Application

    /**
     * Unique Identifier for the service providers
     */
    public static uid?: number

    /**
     * Sort order
     */

    public static order?: `before:${string}` | `after:${string}` | string | undefined

    /**
     * Sort priority
     */
    public static priority = 0

    /**
     * Indicate that this service provider only runs in console
     */
    public static console = false

    /**
     * List of registered console commands
     */
    public registeredCommands?: (new (app: any, kernel: any) => any)[]

    constructor(app: Application) {
        super()
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

    /**
     * Register the listed service providers.
     * 
     * @param commands An array of console commands to register.
     * 
     * @deprecated since version 1.16.0. Will be removed in future versions, use `registerCommands` instead
     */
    commands (commands: (new (app: any, kernel: any) => any)[]): void {
        this.registerCommands(commands)
    }

    /**
     * Register the listed service providers.
     * 
     * @param commands An array of console commands to register.
     */
    registerCommands (commands: (new (app: any, kernel: any) => any)[]) {
        this.registeredCommands = commands
    }
}
