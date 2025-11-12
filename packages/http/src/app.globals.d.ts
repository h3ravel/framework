import { ISessionManager } from '@h3ravel/shared'
import { Request, Response } from '.'

export { }

declare global {
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
