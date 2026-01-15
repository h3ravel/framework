import { CallableConstructor, GenericObject } from '../Utilities/Utilities'

import { IRequest } from '../Http/IRequest'
import { IRoute } from '../Routing/IRoute'
import { IRouteCollection } from '../Routing/IRouteCollection'
import { RouteParams } from './Utils'
import { UrlRoutable } from '../Routing/Traits/UrlRoutable'

export abstract class IUrlGenerator {
    /**
     * The named parameter defaults.
     */
    abstract defaultParameters: GenericObject

    /**
     * Get the full URL for the current request,
     * including the query string.
     *
     * Example:
     *   https://example.com/users?page=2
     */
    abstract full (): string;

    /**
     * Get the URL for the current request path
     * without modifying the query string.
     */
    abstract current (): string;

    /**
     * Get the URL for the previous request.
     *
     * Resolution order:
     * 1. HTTP Referer header
     * 2. Session-stored previous URL
     * 3. Fallback (if provided)
     * 4. Root "/"
     *
     * @param fallback Optional fallback path or URL
     */
    abstract previous (fallback?: string | false): string;

    /**
     * Generate an absolute URL to the given path.
     *
     * - Accepts relative paths or full URLs
     * - Automatically prefixes scheme + host
     * - Encodes extra path parameters safely
     *
     * @param path Relative or absolute path
     * @param extra Additional path segments
     * @param secure Force HTTPS or HTTP
     */
    abstract to (path: string, extra?: (string | number)[], secure?: boolean | null): string;

    /**
     * Generate a secure (HTTPS) absolute URL.
     *
     * @param path
     * @param parameters
     * @returns
     */
    abstract secure (path: string, parameters?: any[]): string;

    /**
     * Generate a URL to a public asset.
     *
     * - Skips URL generation if path is already absolute
     * - Removes index.php from root if present
     *
     * @param path Asset path
     * @param secure Force HTTPS
     */
    abstract asset (path: string, secure?: boolean | null): string;

    /**
     * Generate a secure (HTTPS) asset URL.
     *
     * @param path
     * @returns
     */
    abstract secureAsset (path: string): string;

    /**
     * Resolve the URL scheme to use.
     *
     * Priority:
     * 1. Explicit `secure` flag
     * 2. Forced scheme
     * 3. Request scheme (cached)
     *
     * @param secure
     */
    abstract formatScheme (secure?: boolean | null): string;

    /**
     * Format the base root URL.
     *
     * - Applies forced root if present
     * - Replaces scheme while preserving host
     * - Result is cached per request
     *
     * @param scheme URL scheme
     * @param root Optional custom root
     */
    abstract formatRoot (scheme: string, root?: string): string;

    abstract signedRoute (name: string, parameters?: Record<string, any>, expiration?: number, absolute?: boolean): string;

    abstract hasValidSignature (request: IRequest): boolean;

    abstract route (name: string, parameters?: GenericObject, absolute?: boolean): string;

    /**
     * Get the URL for a given route instance.
     *
     * @param  route
     * @param  parameters
     * @param  absolute
     */
    abstract toRoute (route: IRoute, parameters?: GenericObject, absolute?: boolean): string;

    /**
     * Combine root and path into a final URL.
     *
     * Allows optional host and path formatters
     * to modify the output dynamically.
     *
     * @param root
     * @param path
     * @param route
     * @returns
     */
    abstract format (root: string, path: string, route?: IRoute): string;

    /**
     * Format the array of URL parameters.
     *
     * @param  parameters
     */
    abstract formatParameters (parameters: GenericObject<UrlRoutable> | RouteParams): GenericObject;

    /**
     * Determine whether a string is a valid URL.
     *
     * Supports:
     * - Absolute URLs
     * - Protocol-relative URLs
     * - Anchors and special schemes
     *
     * @param path
     * @returns
     */
    abstract isValidUrl (path: string): boolean;

    /**
     * Force HTTPS for all generated URLs.
     *
     * @param force
     */
    abstract forceHttps (force?: boolean): void;

    /**
     * Set the origin (scheme + host) for generated URLs.
     *
     * @param root
     */
    abstract useOrigin (root?: string): void;

    abstract useAssetOrigin (root?: string): void;

    abstract setKeyResolver (resolver: () => string | string[]): void;

    abstract resolveMissingNamedRoutesUsing (resolver: CallableConstructor): void;

    abstract formatHostUsing (callback: CallableConstructor): this;

    abstract formatPathUsing (callback: CallableConstructor): this;

    /**
     * Get the request instance.
     */
    abstract getRequest (): IRequest

    /**
     * Set the current request instance.
     *
     * @param  request
     */
    abstract setRequest (request: IRequest): void;

    /**
     * Set the route collection.
     *
     * @param routes
     */
    abstract setRoutes (routes: IRouteCollection): this;

    /**
     * Get the route collection.
     */
    abstract getRoutes (): IRouteCollection

    /**
     * Set the session resolver for the generator.
     *
     * @param   sessionResolver
     */
    abstract setSessionResolver (sessionResolver: CallableConstructor): this;

    /**
     * Clone a new instance of the URL generator with a different encryption key resolver.
     *
     * @param  keyResolver
     */
    abstract withKeyResolver (keyResolver: () => string | string[]): void;

    /**
     * Set the default named parameters used by the URL generator.
     *
     * @param  array  $defaults
     * @return void
     */
    abstract defaults (defaults: GenericObject): void;
}