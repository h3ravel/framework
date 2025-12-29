export declare class FlashBag {
    /**
     * Flash a value for the next request
     *
     * @param key Key to store in flash
     * @param value Value to be flashed
     */
    flash (key: string, value: any): void;
    /**
     * Store a temporary value for the current request only
     *
     * @param key Key to store
     * @param value Value to store
     */
    now (key: string, value: any): void;
    /**
     * Reflash all current flash data for another request cycle
     */
    reflash (): void;
    /**
     * Keep only specific flash keys for the next request
     *
     * @param keys Keys to keep
     */
    keep (keys: string[]): void;
    /**
     * Age flash data at the end of the request
     *
     * - Removes old flash data
     * - Moves new flash data to old
     * - Clears new flash data
     */
    ageFlashData (): void;
    /**
     * Get a flash value
     *
     * @param key Key to retrieve
     * @param defaultValue Default value if key doesn't exist
     * @returns Flash value or default
     */
    get (key: string, defaultValue?: any): any;
    /**
     * Check if a flash key exists
     *
     * @param key Key to check
     * @returns Boolean indicating existence
     */
    has (key: string): boolean;
    /**
     * Get all flash data
     *
     * @returns Combined flash data
     */
    all (): Record<string, any>;
    /**
     * Get all flash data keys
     *
     * @returns Combined flash data
     */
    keys (): string[];
    /**
     * Get the raww flash data
     *
     * @returns raw flash data
     */
    raw (): Record<string, any>;
    /**
     * Clear all flash data
     */
    clear (): void;
}