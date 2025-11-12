/**
 * SessionDriver Interface
 *
 * All session drivers must implement these methods to ensure
 * consistency across different storage mechanisms (memory, file, db, redis).
 */
export interface SessionDriver {
    /**
     * Retrieve a value from the session by key.
     */
    get (key: string): any | Promise<any>

    /**
     * Store a value in the session.
     */
    set (key: string, value: any): void | Promise<void>

    /**
     * Store multiple key/value pairs in the session.
     */
    put (data: Record<string, any>): void | Promise<void>

    /**
     * Append a value to an array in the session.
     */
    push (key: string, value: any): void | Promise<void>

    /**
     * Remove an item from the session by key.
     */
    forget (key: string): void | Promise<void>

    /**
     * Retrieve all session data.
     */
    all (): Record<string, any> | Promise<Record<string, any>>

    /**
     * Clear all session data.
     */
    flush (): void | Promise<void>
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