/**
 * FlashBag
 * 
 * Manages flash data for session management, handling temporary data 
 * that persists for one request cycle.
 */
export class FlashBag {
    /**
     * Storage for flash data
     * 
     * Structure:
     * {
     *   new: { key1: value1, key2: value2 },
     *   old: { key3: value3, key4: value4 }
     * }
     */
    private flashData: {
        new: Record<string, any>,
        old: Record<string, any>
    } = {
            new: {},
            old: {}
        }

    /**
     * Flash a value for the next request
     * 
     * @param key Key to store in flash
     * @param value Value to be flashed
     */
    flash (key: string, value: any): void {
        this.flashData.new[key] = value
    }

    /**
     * Store a temporary value for the current request only
     * 
     * @param key Key to store
     * @param value Value to store
     */
    now (key: string, value: any): void {
        // This is different from flash as it's not persisted to next request
        this.flashData.new[key] = value
    }

    /**
     * Reflash all current flash data for another request cycle
     */
    reflash (): void {
        // Move current new flash data to old
        this.flashData.old = { ...this.flashData.new }
    }

    /**
     * Keep only specific flash keys for the next request
     * 
     * @param keys Keys to keep
     */
    keep (keys: string[]): void {
        const keptNew: Record<string, any> = {}
        const keptOld: Record<string, any> = {}

        keys.forEach(key => {
            if (this.flashData.new[key] !== undefined) {
                keptNew[key] = this.flashData.new[key]
            }
            if (this.flashData.old[key] !== undefined) {
                keptOld[key] = this.flashData.old[key]
            }
        })

        this.flashData.new = keptNew
        this.flashData.old = keptOld
    }

    /**
     * Age flash data at the end of the request
     * 
     * - Removes old flash data
     * - Moves new flash data to old
     * - Clears new flash data
     */
    ageFlashData (): void {
        // Clear old flash data
        this.flashData.old = {}

        // Move new flash data to old
        this.flashData.old = { ...this.flashData.new }

        // Clear new flash data
        this.flashData.new = {}
    }

    /**
     * Get a flash value
     * 
     * @param key Key to retrieve
     * @param defaultValue Default value if key doesn't exist
     * @returns Flash value or default
     */
    get (key: string, defaultValue?: any): any {
        return this.flashData.new[key]
            ?? this.flashData.old[key]
            ?? defaultValue
    }

    /**
     * Check if a flash key exists
     * 
     * @param key Key to check
     * @returns Boolean indicating existence
     */
    has (key: string): boolean {
        return key in this.flashData.new || key in this.flashData.old
    }

    /**
     * Get all flash data
     * 
     * @returns Combined flash data
     */
    all (): Record<string, any> {
        return { ...this.flashData.old, ...this.flashData.new }
    }

    /**
     * Get all flash data keys
     * 
     * @returns Combined flash data
     */
    keys (): string[] {
        return Object.keys({ ...this.flashData.old, ...this.flashData.new })
    }

    /**
     * Get the raww flash data
     * 
     * @returns raw flash data
     */
    raw (): Record<string, any> {
        return this.flashData
    }

    /**
     * Clear all flash data
     */
    clear (): void {
        this.flashData.new = {}
        this.flashData.old = {}
    }
}
