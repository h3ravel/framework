import { IApplication } from './IApplication'

export interface IServiceProvider {
    /**
     * Unique Identifier for service providers
     */
    uid?: number;

    /**
     * Sort order
     */
    order?: `before:${string}` | `after:${string}` | string | undefined

    /**
     * Sort priority
     */
    priority?: number;

    /**
     * Indicate that this service provider only runs in console
     */
    console?: boolean;

    /**
     * List of registered console commands
     */
    registeredCommands?: (new (app: IApplication, kernel: any) => any)[];

    /**
     * An array of console commands to register.
     */
    commands?(commands: (new (app: IApplication, kernel: any) => any)[]): void

    /**
     * Register bindings to the container.
     * Runs before boot().
     */
    register?(...app: unknown[]): void | Promise<void>

    /**
     * Perform post-registration booting of services.
     * Runs after all providers have been registered.
     */
    boot?(...app: unknown[]): void | Promise<void>
} 
