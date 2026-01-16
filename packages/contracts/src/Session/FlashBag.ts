export abstract class FlashBag {
    /**
     * Flash a value for the next request
     *
     * @param key Key to store in flash
     * @param value Value to be flashed
     */
    abstract flash (key: string, value: any): void;
    /**
     * Store a temporary value for the current request only
     *
     * @param key Key to store
     * @param value Value to store
     */
    abstract now (key: string, value: any): void;
    /**
     * Reflash all current flash data for another request cycle
     */
    abstract reflash (): void;
    /**
     * Keep only specific flash keys for the next request
     *
     * @param keys Keys to keep
     */
    abstract keep (keys: string[]): void;
    /**
     * Age flash data at the end of the request
     *
     * - Removes old flash data
     * - Moves new flash data to old
     * - Clears new flash data
     */
    abstract ageFlashData (): void;
    /**
     * Get a flash value
     *
     * @param key Key to retrieve
     * @param defaultValue Default value if key doesn't exist
     * @returns Flash value or default
     */
    abstract get (key: string, defaultValue?: any): any;
    /**
     * Check if a flash key exists
     *
     * @param key Key to check
     * @returns Boolean indicating existence
     */
    abstract has (key: string): boolean;
    /**
     * Get all flash data
     *
     * @returns Combined flash data
     */
    abstract all (): Record<string, any>;
    /**
     * Get all flash data keys
     *
     * @returns Combined flash data
     */
    abstract keys (): string[];
    /**
     * Get the raww flash data
     *
     * @returns raw flash data
     */
    abstract raw (): Record<string, any>;
    /**
     * Clear all flash data
     */
    abstract clear (): void;
}