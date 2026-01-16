import { IParamBag } from './IParamBag'

/**
 * ServerBag — a simplified version of Symfony's ServerBag
 * for H3ravel App.
 *
 * Responsible for extracting and normalizing HTTP headers
 * from the incoming request.
 */
export abstract class IServerBag extends IParamBag {
    /**
     * Returns all request headers, normalized to uppercase with underscores.
     * Example: content-type → CONTENT_TYPE
     */
    abstract getHeaders (): Record<string, string>;
    /**
     * Returns a specific header by name, case-insensitive.
     */
    abstract get (name: string): string | undefined;
    /**
     * Returns true if a header exists.
     */
    abstract has (name: string): boolean;
}