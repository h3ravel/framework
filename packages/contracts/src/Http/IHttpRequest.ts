import { H3Event } from 'h3'
import { IApplication } from '../Core/IApplication'
import { IFileBag } from './IFileBag'
import { IHeaderBag } from './IHeaderBag'
import { IHttpContext } from './IHttpContext'
import { IParamBag } from './IParamBag'
import { IServerBag } from './IServerBag'
import { IUrl } from '../Url/IUrl'
import { InputBag } from './IInputBag'
import { RequestMethod } from '../Utilities/Utilities'
import { RouteParams } from '../Url/Utils'

export abstract class IHttpRequest {
    /**
     * The current app instance
     */
    abstract app: IApplication
    /**
     * Parsed request body
     */
    abstract body: unknown
    /**
     * Gets route parameters.
     * @returns An object containing route parameters.
     */
    abstract params: NonNullable<H3Event['context']['params']>
    /**
     * Uploaded files (FILES).
     */
    abstract files: IFileBag
    /**
     * Query string parameters (GET).
     */
    abstract _query: RouteParams
    /**
     * Server and execution environment parameters
     */
    abstract _server: IServerBag
    /**
     * Cookies
     */
    abstract cookies: InputBag
    /**
     * The current Http Context
     */
    abstract context: IHttpContext
    /**
     * The request attributes (parameters parsed from the PATH_INFO, ...).
     */
    abstract attributes: IParamBag
    /**
     * Gets the request headers.
     * @returns An object containing request headers.
     */
    abstract headers: IHeaderBag
    /**
     * Sets the parameters for this request.
     *
     * This method also re-initializes all properties.
     *
     * @param attributes
     * @param cookies    The COOKIE parameters
     * @param files      The FILES parameters
     * @param server     The SERVER parameters
     * @param content    The raw body data
     */
    abstract initialize (): void;
    /**
     * Gets a list of content types acceptable by the client browser in preferable order.
     * @returns {string[]}
     */
    abstract getAcceptableContentTypes (): string[];
    /**
     * Get a URI instance for the request.
     */
    abstract getUriInstance (): IUrl;
    /**
     * Returns the requested URI (path and query string).
     *
     * @return {string} The raw URI (i.e. not URI decoded)
     */
    abstract getRequestUri (): string;
    /**
     * Gets the scheme and HTTP host.
     *
     * If the URL was called with basic authentication, the user
     * and the password are not added to the generated string.
     */
    abstract getSchemeAndHttpHost (): string;
    /**
     * Returns the HTTP host being requested.
     *
     * The port name will be appended to the host if it's non-standard.
     */
    abstract getHttpHost (): string;
    /**
     * Returns the root path from which this request is executed.
     *
     * @returns {string} The raw path (i.e. not urldecoded)
     */
    abstract getBasePath (): string;
    /**
     * Returns the root URL from which this request is executed.
     *
     * The base URL never ends with a /.
     *
     * This is similar to getBasePath(), except that it also includes the
     * script filename (e.g. index.php) if one exists.
     *
     * @return string The raw URL (i.e. not urldecoded)
     */
    abstract getBaseUrl (): string;
    /**
     * Gets the request's scheme.
     */
    abstract getScheme (): string;
    /**
     * Returns the port on which the request is made.
     *
     * This method can read the client port from the "X-Forwarded-Port" header
     * when trusted proxies were set via "setTrustedProxies()".
     *
     * The "X-Forwarded-Port" header must contain the client port.
     *
     * @return int|string|null Can be a string if fetched from the server bag
     */
    abstract getPort (): number | string | undefined;
    abstract getHost (): string;
    /**
     * Checks whether the request is secure or not.
     *
     * This method can read the client protocol from the "X-Forwarded-Proto" header
     * when trusted proxies were set via "setTrustedProxies()".
     *
     * The "X-Forwarded-Proto" header must contain the protocol: "https" or "http".
     */
    abstract isSecure (): boolean;
    /**
     * Returns the value of the requested header.
     */
    abstract getHeader (name: string): string | undefined | null;
    /**
     * Checks if the request method is of specified type.
     *
     * @param method Uppercase request method (GET, POST etc)
     */
    abstract isMethod (method: string): boolean;
    /**
     * Checks whether or not the method is safe.
     *
     * @see https://tools.ietf.org/html/rfc7231#section-4.2.1
     */
    abstract isMethodSafe (): boolean;
    /**
     * Checks whether or not the method is idempotent.
     */
    abstract isMethodIdempotent (): boolean;
    /**
     * Checks whether the method is cacheable or not.
     *
     * @see https://tools.ietf.org/html/rfc7231#section-4.2.3
     */
    abstract isMethodCacheable (): boolean;
    /**
     * Returns true if the request is an XMLHttpRequest (AJAX).
     */
    abstract isXmlHttpRequest (): boolean;
    /**
     * Gets the request "intended" method.
     *
     * If the X-HTTP-Method-Override header is set, and if the method is a POST,
     * then it is used to determine the "real" intended HTTP method.
     *
     * The _method request parameter can also be used to determine the HTTP method,
     * but only if enableHttpMethodParameterOverride() has been called.
     *
     * The method is always an uppercased string.
     *
     * @see getRealMethod()
     */
    abstract getMethod (): RequestMethod;
    /**
     * Gets the preferred format for the response by inspecting, in the following order:
     *   * the request format set using setRequestFormat;
     *   * the values of the Accept HTTP header.
     *
     * Note that if you use this method, you should send the "Vary: Accept" header
     * in the response to prevent any issues with intermediary HTTP caches.
     */
    abstract getPreferredFormat (defaultValue?: string): string | undefined;
    /**
     * Gets the format associated with the mime type.
     */
    abstract getFormat (mimeType: string): string | undefined;
    /**
     * Gets the request format.
     *
     * Here is the process to determine the format:
     *
     *  * format defined by the user (with setRequestFormat())
     *  * _format request attribute
     *  * $default
     *
     * @see getPreferredFormat
     */
    abstract getRequestFormat (defaultValue?: string): string | undefined;
    /**
     * Sets the request format.
     */
    abstract setRequestFormat (format: string): void;
    /**
     * Gets the "real" request method.
     *
     * @see getMethod()
     */
    abstract getRealMethod (): RequestMethod;
    /**
     * Gets the mime type associated with the format.
     */
    abstract getMimeType (format: string): string | undefined;
    /**
     * Returns the request body content.
     *
     * @param asStream If true, returns a ReadableStream instead of the parsed string
     * @return {string | ReadableStream | Promise<string | ReadableStream>}
     */
    abstract getContent (asStream?: boolean): string | ReadableStream;
    /**
     * Gets a "parameter" value from any bag.
     *
     * This method is mainly useful for libraries that want to provide some flexibility. If you don't need the
     * flexibility in controllers, it is better to explicitly get request parameters from the appropriate
     * public property instead (attributes, query, request).
     *
     * Order of precedence: PATH (routing placeholders or custom attributes), GET, POST
     *
     * @internal use explicit input sources instead
     */
    abstract get (key: string, defaultValue?: any): any;
    /**
     * Indicates whether this request originated from a trusted proxy.
     *
     * This can be useful to determine whether or not to trust the
     * contents of a proxy-specific header.
     */
    abstract isFromTrustedProxy (): boolean;
    /**
     * Returns the path being requested relative to the executed script.
     *
     * The path info always starts with a /.
     *
     * @return {string} The raw path (i.e. not urldecoded)
     */
    abstract getPathInfo (): string;
}