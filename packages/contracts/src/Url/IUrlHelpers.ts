import { ExtractClassMethods } from '../Utilities/Utilities'
import { IUrl } from './IUrl'

/**
 * The Url Helper Contract
 */
export abstract class IUrlHelpers {
    /**
     * Create a URL from a path relative to the app URL
     */
    abstract to: (path: string) => IUrl

    /**
     * Create a URL from a named route
     */
    abstract route: (name: string, params?: Record<string, any>) => string

    /**
     * Create a signed URL from a named route
     * 
     * @param name 
     * @param params 
     * @returns 
     */
    abstract signedRoute: (name: string, params?: Record<string, any>) => IUrl

    /**
     * Create a temporary signed URL from a named route
     * 
     * @param name 
     * @param params 
     * @param expiration 
     * @returns 
     */
    abstract temporarySignedRoute: (name: string, params: Record<string, any> | undefined, expiration: number) => IUrl

    /**
     * Create a URL from a controller action
     */
    abstract action: <C extends new (...args: any) => any>(
        controller: string | [C, methodName: ExtractClassMethods<InstanceType<C>>],
        params?: Record<string, any>
    ) => string

    /**
     * Get request-aware URL helpers
     */
    abstract url: {
        (): IUrlHelpers
        (path: string): string
    }
}