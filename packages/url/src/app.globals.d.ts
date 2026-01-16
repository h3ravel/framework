import { ExtractClassMethods } from '@h3ravel/shared'

export { }

declare global {
    /**
     * Create a URL from a controller action
     */
    function action<C extends new (...args: any) => any> (
        controller: string | [C, methodName: ExtractClassMethods<InstanceType<C>>],
        params?: Record<string, any>
    ): string;
}
