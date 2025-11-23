import { FlashBag } from '../FlashBag'

/**
 * SessionDriver Interface
 *
 * All session drivers must implement these methods to ensure
 * consistency across different storage mechanisms (memory, files, database, redis).
 */
export interface SessionDriver {
    flashBag: FlashBag

    /**
     * Retrieve a value from the session by key.
     * 
     * @param key 
     * @param defaultValue 
     */
    get<T = any> (key: string, defaultValue?: any): T | Promise<T>

    /**
     * Store multiple values in the session.
     * 
     * @param key 
     * @param defaultValue 
     */
    set (value: Record<string, any>): void | Promise<void>

    /**
     * Retrieve all data from the session including flash
     * 
     * @returns 
     */
    getAll<T extends Record<string, any>> (): Promise<T> | T

    /**
     * Store a value in the session.
     * 
     * @param key 
     * @param value 
     */
    put (key: string, value: any): void | Promise<void>

    /** 
     * Append a value to an array key
     * 
     * @param key 
     * @param value 
     */
    push (key: string, value: any): Promise<void> | void

    /**
     * Remove a key from the session.
     * 
     * @param key 
     */
    forget (key: string): Promise<void> | void

    /**
     * Determine if a key is present in the session.
     * 
     * @param key 
     */
    has (key: string): Promise<boolean> | boolean

    /**
     * Determine if a key exists in the session (even if null).
     * 
     * @param key 
     */
    exists (key: string): Promise<boolean> | boolean

    /**
     * Get all data from the session.
     */
    all<T extends Record<string, any>> (): Promise<T> | T

    /**
     * Get only a subset of session keys.
     * 
     * @param keys 
     */
    only<T extends Record<string, any>> (keys: string[]): Promise<T> | T

    /**
     * Get all session data except the specified keys.
     * 
     * @param keys 
     */
    except<T extends Record<string, any>> (keys: string[]): Promise<T> | T

    /**
     * Get and remove an item from the session.
     * 
     * @param key 
     * @param defaultValue 
     */
    pull<T = any> (key: string, defaultValue?: any): Promise<T> | T

    /**
     * Increment a numeric session value.
     * 
     * @param key 
     * @param amount 
     */
    increment (key: string, amount?: number): Promise<number> | number

    /**
     * Decrement a numeric session value.
     * 
     * @param key 
     * @param amount 
     */
    decrement (key: string, amount?: number): Promise<number> | number

    /**
     * Flash a key/value pair for the next request only.
     * 
     * @param key 
     * @param value 
     */
    flash (key: string, value: any): Promise<void> | void

    /**
     * Reflash all current flash data for another request cycle.
     */
    reflash (): Promise<void> | void

    /**
     * Keep only specific flash data for another request.
     * 
     * @param keys 
     */
    keep (keys: string[]): Promise<void> | void

    /**
     * Store data for the current request only (not persisted).
     * 
     * @param key 
     * @param value 
     */
    now (key: string, value: any): Promise<void> | void

    /**
     * Regenerate the session ID and optionally persist the data.
     */
    regenerate (): Promise<void> | void

    /**
     * Invalidate the session completely and regenerate ID.
     */
    invalidate (): Promise<void> | void

    /**
     * Determine if an item is not present in the session. 
     * 
     * @param key
     */
    missing (key: string): Promise<boolean> | boolean

    /** 
     * Flush all session data
     */
    flush (): Promise<void> | void

    /** 
     * Age flash data at the end of the request lifecycle.
     */
    ageFlashData (): Promise<void> | void
}

export interface DriverOption {
    cwd?: string
    dir?: string
    table?: string
    prefix?: string
    client?: any
    sessionId?: string
    sessionDir?: string
}

/**
 * A builder function that returns a SessionDriver for a given sessionId.
 *
 * The builder receives the sessionId and a driver-specific options bag.
 */
export type DriverBuilder = (sessionId: string, options?: DriverOption) => SessionDriver