export abstract class IServiceProvider {
    /**
     * Unique Identifier for service providers
     */
    static uid?: number

    /**
     * Sort order
     */
    static order?: `before:${string}` | `after:${string}` | string | undefined

    /**
     * Sort priority
     */
    static priority?: number

    /**
     * Indicate that this service provider only runs in console
     */
    static runsInConsole?: boolean

    /**
     * Indicate that this service provider only runs in console
     */
    static console?: boolean

    /**
     * Indicate that this service provider only runs in console
     */
    abstract console?: boolean

    /**
     * Indicate that this service provider only runs in console
     */
    abstract runsInConsole: boolean

    /**
     * List of registered console commands
     */
    abstract registeredCommands?: (new (app: any, kernel: any) => any)[]

    /**
     * An array of console commands to register.
     */
    abstract commands?(commands: (new (app: any, kernel: any) => any)[]): void

    /**
     * Register bindings to the container.
     * Runs before boot().
     */
    abstract register (...app: unknown[]): void | Promise<void>

    /**
     * Perform post-registration booting of services.
     * Runs after all providers have been registered.
     */
    boot?(...app: unknown[]): void | Promise<void>

    /**
     * Register a booted callback to be run after the "boot" method is called.
     *
     * @param callback
     */
    abstract booted (callback: (...args: any[]) => void): void

    /**
     * Call the registered booted callbacks.
     */
    abstract callBootedCallbacks (): Promise<void>

    /**
     * Register the listed service providers.
     *
     * @param commands An array of console commands to register.
     */
    abstract registerCommands (commands: (new (app: any, kernel: any) => any)[]): void;
}