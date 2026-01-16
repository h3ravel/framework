import { Bindings, GenericObject, IApplication, IRequest, IResponsable, IResponse, ISessionManager, IUrlGenerator, UseKey } from '@h3ravel/contracts'

export { }

declare global {
    /**
     * Get the available Application instance.
     */
    function app (): IApplication
    /**
     * Get the available Application instance.
     * 
     * @param key 
     */
    function app<T extends UseKey> (key: T): Bindings[T];
    /**
     * Get the available Application instance.
     * 
     * @param key 
     */
    function app<C extends abstract new (...args: any[]) => any> (key: C): InstanceType<C>;
    /**
     * Get the available Application instance.
     * 
     * @param key 
     */
    function app<F extends (...args: any[]) => any> (key: F): ReturnType<F>;

    /**
     * Dump something and kill the process for quick debugging. Based on Laravel's dd()
     * 
     * @param args 
     */
    function dd (...args: any[]): never

    /**
     * Dump something but keep the process for quick debugging. Based on Laravel's dump()
     * 
     * @param args 
     */
    function dump (...args: any[]): void

    /**
     * Global env variable
     */
    function env (): NodeJS.ProcessEnv;
    /**
     * Global env variable
     * 
     * @param key 
     * @param defaultValue 
     */
    function env<T extends string> (key: T, defaultValue?: any): any;

    /**
     * Load config options
     */
    function config<X extends Record<string, any>> (): X;
    /**
     * Load config option 
     * 
     * @param key 
     * @param defaultValue 
     */
    function config<X extends Record<string, any>, T extends Extract<keyof X, string>> (key: T, defaultValue?: any): X[T];
    /**
     * Load config option  
     * 
     * @param key 
     */
    function config<T extends Record<string, any>> (key: T): void;

    /**
     * Generate a URL instance.
     */
    function url (): IUrlGenerator;
    /**
     * Generate a URL for the current application instance.
     * 
     * @param path 
     * @param parameters 
     * @param secure 
     */
    function url (path?: string, parameters: (string | number)[] = [], secure?: boolean): string;

    /**
     * Get the URL to a named route.
     * 
     * @param name 
     * @param parameters 
     * @param absolute 
     * @returns 
     */
    function route (name: string, parameters: GenericObject = {}, absolute?: boolean): string

    /**
     * Get the evaluated view contents for the given view.
     * 
     * @param viewPath 
     * @param params 
     */
    function view (viewPath: string, params?: Record<string, any> | undefined): Promise<IResponsable>

    /**
     * Get static asset
     * 
     * @param asset Name of the asset to serve
     * @param defaultValue Default asset to serve if asset does not exist 
     */
    function asset (asset: string, defaultValue?: string): string

    /**
     * Get an instance of the Request class
     * 
     * @returns a global instance of the Request class.
     */
    function request (): IRequest

    /**
     * Get an instance of the Response class
     * 
     * @returns a global instance of the Response class.
     */
    function response (): IResponse

    /**
     * Get the flashed input from previous request
     * 
     * @param key 
     * @param defaultValue 
     * @returns 
     */
    function old (): Promise<Record<string, any>>
    function old (key: string, defaultValue?: any): Promise<any>

    /**
     * Get an instance of the current session manager
     * 
     * @param key 
     * @param defaultValue 
     * @returns a global instance of the current session manager.
     */
    function session<K extends string | Record<string, any> | undefined = undefined> (key?: K, defaultValue?: any): K extends undefined
        ? ISessionManager
        : K extends string
        ? any : void | Promise<void>

    /**
     * Get app path
     * 
     * @param path 
     */
    function app_path (path?: string): string

    /**
     * Get base path
     * 
     * @param path 
     */
    function base_path (path?: string): string

    /**
     * Get public path
     * 
     * @param path 
     */
    function public_path (path?: string): string

    /**
     * Get storage path
     * 
     * @param path 
     */
    function storage_path (path?: string): string

    /**
     * Get the database path
     *
     * @param path
     */
    function database_path (path?: string): string

    /**
     * Hash the given value against the bcrypt algorithm.
     * 
     * @param value 
     * @param options 
     */
    function bcrypt (value: string, options?: HashOptions): Promise<string>
}
