import type { ISessionManager } from '@h3ravel/contracts'
import type { Request, Response } from '.'

export { }

declare global {
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
     * Get an instance of the Request class
     * 
     * @returns a global instance of the Request class.
     */
    function request (): Request
    /**
     * Get an instance of the Response class
     * 
     * @returns a global instance of the Response class.
     */
    function response (): Response
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
}
