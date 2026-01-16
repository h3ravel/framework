/**
 * Service provider for Validation utilities
 */
export class ValidationServiceProvider {
    public registeredCommands?: (new (app: any, kernel: any) => any)[]
    public static priority = 895

    constructor(private app: any) { }

    /**
     * Register URL services in the container
     */
    register (): void {
    }

    /**
     * Boot URL services
     */
    boot (): void {
    }
}
