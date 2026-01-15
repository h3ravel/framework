import { FlashBag } from './FlashBag'

/**
 * SessionDriver Interface
 *
 * All session drivers must implement these methods to ensure
 * consistency across different storage mechanisms (memory, files, database, redis).
 */
export abstract class ISessionDriver {
    abstract flashBag: FlashBag

    /**
     * Retrieve a value from the session by key.
     * 
     * @param key 
     * @param defaultValue 
     */
    abstract get<T = any> (key: string, defaultValue?: any): T | Promise<T>

    /**
     * Store multiple values in the session.
     * 
     * @param key 
     * @param defaultValue 
     */
    abstract set (value: Record<string, any>): void | Promise<void>

    /**
     * Retrieve all data from the session including flash
     * 
     * @returns 
     */
    abstract getAll<T extends Record<string, any>> (): Promise<T> | T

    /**
     * Store a value in the session.
     * 
     * @param key 
     * @param value 
     */
    abstract put (key: string, value: any): void | Promise<void>

    /** 
     * Append a value to an array key
     * 
     * @param key 
     * @param value 
    */
    abstract push (key: string, value: any): Promise<void> | void

    /**
     * Remove a key from the session.
     * 
     * @param key 
     */
    abstract forget (key: string): Promise<void> | void

    /**
     * Determine if a key is present in the session.
     * 
     * @param key 
    */
    abstract has (key: string): Promise<boolean> | boolean

    /**
     * Determine if a key exists in the session (even if null).
     * 
     * @param key 
     */
    abstract exists (key: string): Promise<boolean> | boolean

    /**
     * Get all data from the session.
     */
    abstract all<T extends Record<string, any>> (): Promise<T> | T

    /**
     * Get only a subset of session keys.
     * 
     * @param keys 
     */
    abstract only<T extends Record<string, any>> (keys: string[]): Promise<T> | T

    /**
     * Get all session data except the specified keys.
     * 
     * @param keys 
     */
    abstract except<T extends Record<string, any>> (keys: string[]): Promise<T> | T

    /**
     * Get and remove an item from the session.
     * 
     * @param key 
     * @param defaultValue 
     */
    abstract pull<T = any> (key: string, defaultValue?: any): Promise<T> | T

    /**
     * Increment a numeric session value.
     * 
     * @param key 
     * @param amount 
     */
    abstract increment (key: string, amount?: number): Promise<number> | number

    /**
     * Decrement a numeric session value.
     * 
     * @param key 
     * @param amount 
     */
    abstract decrement (key: string, amount?: number): Promise<number> | number

    /**
     * Flash a key/value pair for the next request only.
     * 
     * @param key 
     * @param value 
     */
    abstract flash (key: string, value: any): Promise<void> | void

    /**
     * Reflash all current flash data for another request cycle.
     */
    abstract reflash (): Promise<void> | void

    /**
     * Keep only specific flash data for another request.
     * 
     * @param keys 
     */
    abstract keep (keys: string[]): Promise<void> | void

    /**
     * Store data for the current request only (not persisted).
     * 
     * @param key 
     * @param value 
     */
    abstract now (key: string, value: any): Promise<void> | void

    /**
     * Regenerate the session ID and optionally persist the data.
     */
    abstract regenerate (): Promise<void> | void

    /**
     * Invalidate the session completely and regenerate ID.
     */
    abstract invalidate (): Promise<void> | void

    /**
     * Determine if an item is not present in the session. 
     * 
     * @param key
     */
    abstract missing (key: string): Promise<boolean> | boolean

    /** 
     * Flush all session data
     */
    abstract flush (): Promise<void> | void

    /** 
     * Age flash data at the end of the request lifecycle.
     */
    abstract ageFlashData (): Promise<void> | void
}