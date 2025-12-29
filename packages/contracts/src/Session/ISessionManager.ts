import type { DriverOption } from './SessionContract'
import type { IHttpContext } from '../Http/IHttpContext'

/**
 * SessionManager
 *
 * Handles session initialization, ID generation, and encryption.
 * Each request gets a unique session namespace tied to its ID.
 */
export declare class ISessionManager {
    /**
     * @param ctx - incoming request http context
     * @param driverName - registered driver key ('file' | 'database' | 'memory' | 'redis')
     * @param driverOptions - optional bag for driver-specific options
     */
    constructor(ctx: IHttpContext, driverName: 'file' | 'memory' | 'database' | 'redis', driverOptions: DriverOption)

    /**
     * Access the current session ID.
     */
    id (): string;
    /**
     * Retrieve a value from the session
     *
     * @param key
     * @returns
     */
    get (key: string, defaultValue?: any): Promise<any> | any;
    /**
     * Store a value in the session
     *
     * @param key
     * @param value
     */
    set (value: Record<string, any>): Promise<void> | void;
    /**
     * Store multiple key/value pairs
     *
     * @param values
     */
    put (key: string, value: any): void | Promise<void>;
    /**
     * Append a value to an array key
     *
     * @param key
     * @param value
     */
    push (key: string, value: any): void | Promise<void>;
    /**
     * Remove a key from the session
     *
     * @param key
     */
    forget (key: string): void | Promise<void>;
    /**
     * Retrieve all session data
     *
     * @returns
     */
    all (): Record<string, any> | Promise<Record<string, any>>;
    /**
     * Determine if a key exists (even if null).
     *
     * @param key
     * @returns
     */
    exists (key: string): Promise<boolean> | boolean;
    /**
     * Determine if a key has a non-null value.
     *
     * @param key
     * @returns
     */
    has (key: string): Promise<boolean> | boolean;
    /**
     * Get only specific keys.
     *
     * @param keys
     * @returns
     */
    only (keys: string[]): Record<string, any> | Promise<Record<string, any>>;
    /**
     * Return all keys except the specified ones.
     *
     * @param keys
     * @returns
     */
    except (keys: string[]): Record<string, any> | Promise<Record<string, any>>;
    /**
     * Return and delete a key from the session.
     *
     * @param key
     * @param defaultValue
     * @returns
     */
    pull (key: string, defaultValue?: any): any;
    /**
     * Increment a numeric value by amount (default 1).
     *
     * @param key
     * @param amount
     * @returns
     */
    increment (key: string, amount?: number): Promise<number> | number;
    /**
     * Decrement a numeric value by amount (default 1).
     *
     * @param key
     * @param amount
     * @returns
     */
    decrement (key: string, amount?: number): number | Promise<number>;
    /**
     * Flash a value for next request only.
     *
     * @param key
     * @param value
     */
    flash (key: string, value: any): void | Promise<void>;
    /**
     * Reflash all flash data for one more cycle.
     *
     * @returns
     */
    reflash (): void | Promise<void>;
    /**
     * Keep only selected flash data.
     *
     * @param keys
     * @returns
     */
    keep (keys: string[]): void | Promise<void>;
    /**
     * Store data only for current request cycle (not persisted).
     *
     * @param key
     * @param value
     */
    now (key: string, value: any): void | Promise<void>;
    /**
     * Regenerate session ID and persist data under new ID.
     */
    regenerate (): void | Promise<void>;
    /**
     * Determine if an item is not present in the session.
     *
     * @param key
     * @returns
     */
    missing (key: string): Promise<boolean> | boolean;
    /**
     * Flush all session data
     */
    flush (): void | Promise<void>;
    /**
     * Age flash data at the end of the request lifecycle.
     * 
     * @returns
     */
    ageFlashData (): void | Promise<void>;
}