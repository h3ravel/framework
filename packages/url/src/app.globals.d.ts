import { ExtractClassMethods } from '@h3ravel/shared'
import { RequestAwareHelpers } from '.'

export { }

declare global {
    /**
     * Create a URL from a controller action
     */
    function action<C extends new (...args: any) => any> (
        controller: string | [C, methodName: ExtractClassMethods<InstanceType<C>>],
        params?: Record<string, any>
    ): string;

    /**
     * Get request-aware URL helpers
     */
    function url (): RequestAwareHelpers;
    function url (path: string): string;
}
