import { CallableConstructor } from '../Utilities/Utilities'

export abstract class IAppBuilder {
    /**
     * Register the base kernel classes for the application.
     */
    abstract withKernels (): this;

    /**
     * Register and wire up the application's exception handling layer.
     *
     * @param using
     **/
    abstract withExceptions (using: (exceptions: any) => void): this;

    /**
     * Register and wire up the application's middleware handling layer.
     *
     * @param using
     **/
    abstract withMiddleware (callback?: (mw: any) => void): this;

    /**
     * Register the routing services for the application.
     */
    abstract withRouting ({
        using,
        web,
        api,
        commands,
        health,
        channels,
        pages,
        apiPrefix,
        then
    }?: {
        using?: CallableConstructor;
        web?: string | string[];
        api?: string | string[];
        commands?: string;
        health?: string;
        channels?: string;
        pages?: string;
        apiPrefix?: string;
        then?: CallableConstructor;
    }): this;

    /**
     * create
     */
    abstract create (): void;
}