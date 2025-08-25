export interface IServiceProvider {
    /**
     * Sort order
     */
    order?: `before:${string}` | `after:${string}` | string | undefined

    /**
     * Sort priority
     */
    priority?: number;

    /**
     * Register bindings to the container.
     * Runs before boot().
     */
    register (...app: unknown[]): void | Promise<void>

    /**
     * Perform post-registration booting of services.
     * Runs after all providers have been registered.
     */
    boot?(...app: unknown[]): void | Promise<void>
} 
