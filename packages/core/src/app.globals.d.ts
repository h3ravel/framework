export { }

declare global {
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
     * 
     * @param path 
     */
    function env (): NodeJS.ProcessEnv;
    function env<T extends string> (key: T, def?: any): any;

    /**
     * Load config option
     */
    function config<X extends Record<string, any>> (): X;
    function config<X extends Record<string, any>, T extends Extract<keyof X, string>> (key: T, def?: any): X[T];
    function config<T extends Record<string, any>> (key: T): void;

    /**
     * Render a view
     * 
     * @param viewPath 
     * @param params 
     */
    function view (viewPath: string, params?: Record<string, any> | undefined): Promise<string>

    /**
     * Get static asset
     * 
     * @param asset Name of the asset to serve
     * @param def Default asset to serve if asset does not exist 
     */
    function asset (asset: string, def: string): string

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
     * Generate URLs or get the Url instance
     *
     * @param path
     */
    function url (): import('../../../http/src/Url').Url
    function url (path: string): string
}
