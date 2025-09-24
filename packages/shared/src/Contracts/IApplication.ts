import { IContainer } from './IContainer'
import { IServiceProvider } from './IServiceProvider'

export type IPathName =
    | 'views' | 'routes' | 'assets' | 'base' | 'public'
    | 'storage' | 'config' | 'database'

export interface IApplication extends IContainer {
    /**
     * Registers configured service providers.
     */
    registerConfiguredProviders (): Promise<void>;

    /**
     * Registers an array of external service provider classes.
     * @param providers - Array of service provider constructor functions.
     */
    registerProviders (providers: Array<new (app: IApplication) => IServiceProvider>): void;

    /**
     * Registers a single service provider.
     * @param provider - The service provider instance to register.
     */
    register (provider: IServiceProvider): Promise<void>;

    /**
     * Boots all registered providers.
     */
    boot (): Promise<void>;

    /**
     * Gets the base path of the application.
     * @returns The base path as a string.
     */
    getBasePath (): string;

    /**
     * Retrieves a path by name, optionally appending a sub-path.
     * @param name - The name of the path property.
     * @param pth - Optional sub-path to append.
     * @returns The resolved path as a string.
     */
    getPath (name: string, pth?: string): string;

    /**
     * Sets a path for a given name.
     * @param name - The name of the path property.
     * @param path - The path to set.
     * @returns
     */
    setPath (name: IPathName, path: string): void;

    /**
     * Gets the version of the application or TypeScript.
     * @param key - The key to retrieve ('app' or 'ts').
     * @returns The version string or undefined.
     */
    getVersion (key: string): string | undefined;
}
