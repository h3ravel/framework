import type { ConcreteConstructor, IPathName } from '../Utilities/Utilities'
import type { H3, H3Event } from 'h3'

import { IAppBuilder } from '../Configuration/IAppBuilder'
import { IBootstraper } from '../Foundation/IBootstraper'
import { IContainer } from './IContainer'
import type { IHttpContext } from '../Http/IHttpContext'
import type { IServiceProvider } from './IServiceProvider'
import { IUrl } from '../Url/IUrl'
import type { PathLoader } from '../Utilities/PathLoader'

export abstract class IApplication extends IContainer {
    abstract paths: PathLoader
    context?: (event: H3Event) => Promise<IHttpContext>
    h3Event?: H3Event
    /**
     * List of registered console commands
     */
    abstract registeredCommands: (new (app: any, kernel: any) => any)[]
    /**
     * Get all registered providers
     */
    abstract getRegisteredProviders (): IServiceProvider[];
    /**
     * Configure and Dynamically register all configured service providers, then boot the app.
     *
     * @param providers All regitererable service providers
     * @param filtered A list of service provider name strings we do not want to register at all cost
     * @param autoRegisterProviders If set to false, service providers will not be auto discovered and registered.
     *
     * @returns
     */
    abstract initialize (providers: Array<ConcreteConstructor<IServiceProvider, false>>, filtered?: string[], autoRegisterProviders?: boolean): this;
    /**
     * Dynamically register all configured providers
     *
     * @param autoRegister If set to false, service providers will not be auto discovered and registered.
     */
    abstract registerConfiguredProviders (autoRegister?: boolean): Promise<void>;
    /**
     * Register service providers
     *
     * @param providers
     * @param filtered
     */
    abstract registerProviders (providers: Array<ConcreteConstructor<IServiceProvider, false>>, filtered?: string[]): void;
    /**
     * Register a provider
     */
    abstract register (provider: IServiceProvider): Promise<void>;
    /**
     * Register the listed service providers.
     *
     * @param commands An array of console commands to register.
     */
    abstract withCommands (commands: (new (app: any, kernel: any) => any)[]): this;
    /**
     * checks if the application is running in CLI
     */
    abstract runningInConsole (): boolean;
    /**
     * checks if the application is running in Unit Test
     */
    abstract runningUnitTests (): boolean;

    abstract getRuntimeEnv (): 'browser' | 'node' | 'unknown';
    /**
     * Determine if the application has booted.
     */
    abstract isBooted (): boolean
    /**
     * Boot all service providers after registration
     */
    abstract boot (): Promise<this>;
    /**
     * Register a new boot listener.
     *
     * @param  callable  $callback
     */
    abstract booting (callback: (app: this) => void): void
    /**
     * Register a new "booted" listener.
     *
     * @param callback
     */
    abstract booted (callback: (app: this) => void): void
    /**
     * Handle the incoming HTTP request and send the response to the browser.
     *
     * @param  request
     */
    abstract handleRequest (event: H3Event): Promise<void>
    /**
     * Get the URI resolver callback.
     */
    abstract getUriResolver (): () => typeof IUrl | undefined
    /**
     * Set the URI resolver callback.
     *
     * @param  callback
     */
    abstract setUriResolver (callback: () => typeof IUrl): this
    /**
     * Determine if middleware has been disabled for the application.
     */
    abstract shouldSkipMiddleware (): boolean

    /**
     * Provide safe overides for the app
     */
    abstract configure (): IAppBuilder;
    /**
     * Check if the current application environment matches the one provided
     * 
     * @param env 
     */
    abstract environment<E = string | undefined> (env: E): E extends undefined ? string : boolean;
    /**
     * Fire up the developement server using the user provided arguments
     *
     * Port will be auto assigned if provided one is not available
     *
     * @param h3App The current H3 app instance
     * @param preferedPort If provided, this will overide the port set in the evironment
     * @alias serve
     */
    abstract fire (): Promise<this>;
    abstract fire (h3App: H3, preferredPort?: number): Promise<this>;
    /**
     * Fire up the developement server using the user provided arguments
     *
     * Port will be auto assigned if provided one is not available
     *
     * @param h3App The current H3 app instance
     * @param preferedPort If provided, this will overide the port set in the evironment
     */
    abstract serve (h3App?: H3, preferredPort?: number): Promise<this>;
    /**
     * Run the given array of bootstrap classes.
     *
     * @param bootstrappers
     */
    abstract bootstrapWith (bootstrappers: ConcreteConstructor<IBootstraper>[]): void | Promise<void>
    /**
     * Determine if the application has been bootstrapped before.
     */
    abstract hasBeenBootstrapped (): boolean
    /**
     * Save the curretn H3 instance for possible future use.
     *
     * @param h3App The current H3 app instance
     * @returns
     */
    abstract setH3App (h3App?: H3): this;
    /**
     * Get the base path of the app
     *
     * @returns
     */
    abstract getBasePath (): string;
    /**
     * Dynamically retrieves a path property from the class.
     * Any property ending with "Path" is accessible automatically.
     *
     * @param name - The base name of the path property
     * @returns
     */
    abstract getPath (name: IPathName, suffix?: string): string;
    /**
     * Programatically set the paths.
     *
     * @param name - The base name of the path property
     * @param path - The new path
     * @returns
     */
    abstract setPath (name: IPathName, path: string): void;
    /**
     * Returns the installed version of the system core and typescript.
     *
     * @returns
     */
    abstract getVersion (key: string): string;
}