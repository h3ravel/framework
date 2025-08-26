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

    function config<X extends Record<string, any>> (): X;
    function config<X extends Record<string, any>, T extends Extract<keyof X, string>> (key: T, def?: any): X[T];
    function config<T extends Record<string, any>> (key: T): void;

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
}
