export interface IServiceProvider {
    /**
     * Register bindings to the container.
     * Runs before boot().
     */
    register (): void | Promise<void>

    /**
     * Perform post-registration booting of services.
     * Runs after all providers have been registered.
     */
    boot?(): void | Promise<void>
} 
