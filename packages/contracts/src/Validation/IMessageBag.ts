export declare class ValidationMessageProvider {
    getMessageBag (): IMessageBag;
}

export declare class IMessageBag implements ValidationMessageProvider {
    /**
     * Create a new message bag instance.
     */
    constructor(messages: Record<string, string[] | string>)

    getMessageBag (): IMessageBag;

    /**
     * Get all message keys.
     */
    keys (): string[]

    /**
     * Add a message.
     */
    add (key: string, message: string): this

    /**
     * Add a message conditionally.
     */
    addIf (condition: boolean, key: string, message: string): this

    /**
     * Merge another message source into this one.
     */
    merge (messages: Record<string, string[]> | ValidationMessageProvider): this

    /**
     * Determine if messages exist for all given keys.
     */
    has (key?: string | string[] | null): boolean

    /**
     * Determine if messages exist for any given key.
     */
    hasAny (keys: string | string[]): boolean

    /**
     * Determine if messages don't exist for given keys.
     */
    missing (key: string | string[]): boolean

    /**
     * Get the first message for a given key.
     */
    first (key?: string | null, format?: string | null): string

    /**
     * Get all messages for a given key.
     */
    get (key: string, format?: string | null): string[] | Record<string, string[]>

    /**
     * Get all messages.
     */
    all (format?: string): string[]

    /**
     * Get unique messages.
     */
    unique (format?: string | null): string[]

    /**
     * Remove messages for a key.
     */
    forget (key: string): this

    /**
     * Get raw messages.
     */
    messagesRaw (): Record<string, string[]>

    /**
     * Alias for messagesRaw().
     */
    getMessages (): Record<string, string[]>

    /**
     * Return message bag instance.
     */
    getMessageBag (): IMessageBag

    /**
     * Get format string.
     */
    getFormat (): string

    /**
     * Set default message format.
     */
    setFormat (format: string): this

    /**
     * Empty checks.
     */
    isEmpty (): boolean

    isNotEmpty (): boolean

    any (): boolean

    /**
     * Count total messages.
     */
    count (): number

    /**
     * Array & JSON conversions.
     */
    toArray (): Record<string, string[]>

    jsonSerialize (): any

    toJson (options: number): string

    toPrettyJson (): string

    /**
     * String representation.
     */
    toString (): string
}