import { IApplication } from '../Core/IApplication'
import { ExtractClassMethods } from '../Utilities/Utilities'
import { RouteParams } from './Utils'

export abstract class IUrl {
    /**
     * Create a URL from a full URL string
     */
    static of (url: string, app?: IApplication): IUrl {
        void url
        void app
        return {} as IUrl
    };
    /**
     * Create a URL from a path relative to the app URL
     */
    static to (path: string, app?: IApplication): IUrl {
        void path
        void app
        return {} as IUrl
    };
    /**
     * Create a URL from a named route
     */
    static route<TName extends string = string, TParams extends RouteParams = RouteParams> (
        name: TName,
        params?: TParams,
        app?: IApplication
    ): IUrl {
        void name
        void params
        void app
        return {} as IUrl
    };
    /**
     * Create a signed URL from a named route
     */
    static signedRoute<TName extends string = string, TParams extends RouteParams = RouteParams> (
        name: TName,
        params?: TParams,
        app?: IApplication
    ): IUrl {
        void name
        void params
        void app
        return {} as IUrl
    };
    /**
     * Create a temporary signed URL from a named route
     */
    static temporarySignedRoute<TName extends string = string, TParams extends RouteParams = RouteParams> (
        name: TName,
        params: TParams | undefined,
        expiration: number,
        app?: IApplication
    ): IUrl {
        void name
        void params
        void app
        void expiration
        return {} as IUrl
    };
    /**
     * Create a URL from a controller action
     */
    static action<C extends new (...args: any) => any> (
        controller: string | [C, methodName: ExtractClassMethods<InstanceType<C>>],
        params?: Record<string, any>,
        app?: IApplication
    ): IUrl {
        void controller
        void params
        void app
        return {} as IUrl
    };
    /**
     * Set the scheme (protocol) of the URL
     */
    abstract withScheme (scheme: string): IUrl;
    /**
     * Set the host of the URL
     */
    abstract withHost (host: string): IUrl;
    /**
     * Set the port of the URL
     */
    abstract withPort (port: number): IUrl;
    /**
     * Set the path of the URL
     */
    abstract withPath (path: string): IUrl;
    /**
     * Set the query parameters of the URL
     */
    abstract withQuery (query: Record<string, unknown>): IUrl;
    /**
     * Merge additional query parameters
     */
    abstract withQueryParams (params: Record<string, unknown>): IUrl;
    /**
     * Set the fragment (hash) of the URL
     */
    abstract withFragment (fragment: string): IUrl;
    /**
     * Add a signature to the URL for security
     */
    abstract withSignature (app?: IApplication, expiration?: number): IUrl;
    /**
     * Verify if a URL signature is valid
     */
    abstract hasValidSignature (app?: IApplication): boolean;
    /**
     * Convert the URL to its string representation
     */
    abstract toString (): string;
    /**
     * Get the scheme
     */
    abstract getScheme (): string | undefined;
    /**
     * Get the host
     */
    abstract getHost (): string | undefined;
    /**
     * Get the port
     */
    abstract getPort (): number | undefined;
    /**
     * Get the path
     */
    abstract getPath (): string;
    /**
     * Get the query parameters
     */
    abstract getQuery (): Record<string, unknown>;
    /**
     * Get the fragment
     */
    abstract getFragment (): string | undefined;
}