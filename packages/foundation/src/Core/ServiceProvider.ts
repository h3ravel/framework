import { IApplication, IServiceProvider } from '@h3ravel/contracts'

export abstract class ServiceProvider extends IServiceProvider {
    /**
     * The current app instance
     */
    protected app: IApplication

    /**
     * Unique Identifier for the service providers
     */
    static uid?: number

    /**
     * Sort order
     */

    static order?: `before:${string}` | `after:${string}` | string | undefined

    /**
     * Sort priority
     */
    static priority = 0

    /**
     * Indicate that this service provider only runs in console
     */
    static console = false
    /**
     * Indicate that this service provider only runs in console
     */
    console = false

    /**
     * Indicate that this service provider only runs in console
     */
    runsInConsole = false

    /**
     * List of registered console commands
     */
    registeredCommands?: (new (app: any, kernel: any) => any)[]

    /**
     * All of the registered booted callbacks.
     */
    protected bootedCallbacks: Array<(...args: any[]) => void> = []

    constructor(app: IApplication) {
        super()
        this.app = app
    }

    /**
     * Register a booted callback to be run after the "boot" method is called.
     *
     * @param callback
     */
    booted (callback: (...args: any[]) => void): void | Promise<void> {
        this.bootedCallbacks.push(callback)
    }

    /**
     * Call the registered booted callbacks.
     */
    async callBootedCallbacks (): Promise<void> {
        let index = 0

        while (index < this.bootedCallbacks.length) {
            await this.app.call(this.bootedCallbacks[index])

            index++
        }
    }

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