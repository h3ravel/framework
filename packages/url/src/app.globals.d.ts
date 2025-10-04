import { ExtractControllerMethods } from '@h3ravel/shared'
import { RequestAwareHelpers, Url } from '.'

export { }

declare global {
    /**
     * Create a URL from a named route
     */
    function route (name: string, params?: Record<string, any>): string;

    /**
     * Create a URL from a controller action
     */
    function action<C extends new (...args: any) => any> (
        controller: string | [C, methodName: ExtractControllerMethods<InstanceType<C>>],
        params?: Record<string, any>
    ): string;

    /**
     * Get request-aware URL helpers
     */
    function url (): RequestAwareHelpers;
    function url (path: string): string;
}
