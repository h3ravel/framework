import { FlashBag } from './FlashBag'
import { IApplication } from '../Core/IApplication'
import type { IHttpContext } from '../Http/IHttpContext'
import { ISessionDriver } from './ISessionDriver'

/**
 * SessionManager
 *
 * Handles session initialization, ID generation, and encryption.
 * Each request gets a unique session namespace tied to its ID.
 */
export abstract class ISessionManager {
    abstract flashBag: FlashBag

    /**
     * Access the current session ID.
     */
    abstract id (): string;

    /**
     * Get the current session driver
     */
    abstract getDriver (): ISessionDriver
    /**
     * Retrieve a value from the session
     *
     * @param key
     * @returns
     */
    abstract get (key: string, defaultValue?: any): Promise<any> | any;
    /**
     * Store a value in the session
     *
     * @param key
     * @param value
     */
    abstract set (value: Record<string, any>): Promise<void> | void;
    /**
     * Store multiple key/value pairs
     *
     * @param values
     */
    abstract put (key: string, value: any): void | Promise<void>;
    /**
     * Append a value to an array key
     *
     * @param key
     * @param value
     */
    abstract push (key: string, value: any): void | Promise<void>;
    /**
     * Remove a key from the session
     *
     * @param key
     */
    abstract forget (key: string): void | Promise<void>;
    /**
     * Retrieve all session data
     *
     * @returns
     */
    abstract all (): Record<string, any> | Promise<Record<string, any>>;
    /**
     * Determine if a key exists (even if null).
     *
     * @param key
     * @returns
     */
    abstract exists (key: string): Promise<boolean> | boolean;
    /**
     * Determine if a key has a non-null value.
     *
     * @param key
     * @returns
     */
    abstract has (key: string): Promise<boolean> | boolean;
    /**
     * Get only specific keys.
     *
     * @param keys
     * @returns
     */
    abstract only (keys: string[]): Record<string, any> | Promise<Record<string, any>>;
    /**
     * Return all keys except the specified ones.
     *
     * @param keys
     * @returns
     */
    abstract except (keys: string[]): Record<string, any> | Promise<Record<string, any>>;
    /**
     * Return and delete a key from the session.
     *
     * @param key
     * @param defaultValue
     * @returns
     */
    abstract pull (key: string, defaultValue?: any): any;
    /**
     * Increment a numeric value by amount (default 1).
     *
     * @param key
     * @param amount
     * @returns
     */
    abstract increment (key: string, amount?: number): Promise<number> | number;
    /**
     * Decrement a numeric value by amount (default 1).
     *
     * @param key
     * @param amount
     * @returns
     */
    abstract decrement (key: string, amount?: number): number | Promise<number>;
    /**
     * Flash a value for next request only.
     *
     * @param key
     * @param value
     */
    abstract flash (key: string, value: any): void | Promise<void>;
    /**
     * Reflash all flash data for one more cycle.
     *
     * @returns
     */
    abstract reflash (): void | Promise<void>;
    /**
     * Keep only selected flash data.
     *
     * @param keys
     * @returns
     */
    abstract keep (keys: string[]): void | Promise<void>;
    /**
     * Store data only for current request cycle (not persisted).
     *
     * @param key
     * @param value
     */
    abstract now (key: string, value: any): void | Promise<void>;
    /**
     * Regenerate session ID and persist data under new ID.
     */
    abstract regenerate (): void | Promise<void>;
    /**
     * Determine if an item is not present in the session.
     *
     * @param key
     * @returns
     */
    abstract missing (key: string): Promise<boolean> | boolean;
    /**
     * Flush all session data
     */
    abstract flush (): void | Promise<void>;
    /**
     * Age flash data at the end of the request lifecycle.
     * 
     * @returns
     */
    abstract ageFlashData (): void | Promise<void>;
}