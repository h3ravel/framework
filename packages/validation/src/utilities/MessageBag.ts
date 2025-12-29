import type { IMessageBag, ValidationMessageProvider } from '@h3ravel/contracts'

export class MessageBag implements IMessageBag {
    /**
     * All of the registered messages.
     */
    protected messages: Record<string, string[]> = {}

    /**
     * Default format for message output.
     */
    protected format = ':message'

    /**
     * Create a new message bag instance.
     */
    constructor(messages: Record<string, string[] | string> = {}) {
        for (const [key, value] of Object.entries(messages)) {
            const arr = Array.isArray(value) ? value : [value]
            this.messages[key] = Array.from(new Set(arr))
        }
    }

    /**
     * Get all message keys.
     */
    keys (): string[] {
        return Object.keys(this.messages)
    }

    /**
     * Add a message.
     */
    add (key: string, message: string): this {
        if (this.isUnique(key, message)) {
            if (!this.messages[key]) this.messages[key] = []
            this.messages[key].push(message)
        }
        return this
    }

    /**
     * Add a message conditionally.
     */
    addIf (condition: boolean, key: string, message: string): this {
        return condition ? this.add(key, message) : this
    }

    /**
     * Check uniqueness of key/message pair.
     */
    protected isUnique (key: string, message: string): boolean {
        return !this.messages[key] || !this.messages[key].includes(message)
    }

    /**
     * Merge another message source into this one.
     */
    merge (messages: Record<string, string[]> | ValidationMessageProvider): this {
        const incoming =
            (messages as ValidationMessageProvider).getMessageBag?.()?.getMessages?.() ??
            (messages as Record<string, string[]>)

        for (const [key, list] of Object.entries(incoming)) {
            if (!this.messages[key]) this.messages[key] = []
            this.messages[key].push(...list)
            this.messages[key] = Array.from(new Set(this.messages[key]))
        }
        return this
    }

    /**
     * Determine if messages exist for all given keys.
     */
    has (key: string | string[] | null): boolean {
        if (this.isEmpty()) return false
        if (key == null) return this.any()

        const keys = Array.isArray(key) ? key : [key]
        return keys.every(k => this.first(k) !== '')
    }

    /**
     * Determine if messages exist for any given key.
     */
    hasAny (keys: string | string[] = []): boolean {
        if (this.isEmpty()) return false
        const list = Array.isArray(keys) ? keys : [keys]
        return list.some(k => this.has(k))
    }

    /**
     * Determine if messages don't exist for given keys.
     */
    missing (key: string | string[]): boolean {
        const keys = Array.isArray(key) ? key : [key]
        return !this.hasAny(keys)
    }

    /**
     * Get the first message for a given key.
     */
    first (key: string | null = null, format: string | null = null): string {
        const messages = key == null ? this.all(format) : this.get(key, format)
        const firstMessage = Array.isArray(messages) ? messages[0] ?? '' : ''
        return Array.isArray(firstMessage) ? firstMessage[0] ?? '' : firstMessage
    }

    /**
     * Get all messages for a given key.
     */
    get (key: string, format: string | null = null): string[] | Record<string, string[]> {
        if (this.messages[key]) {
            return this.transform(this.messages[key], this.checkFormat(format), key)
        }

        if (key.includes('*')) {
            return this.getMessagesForWildcardKey(key, format)
        }

        return []
    }

    /**
     * Wildcard key match.
     */
    protected getMessagesForWildcardKey (key: string, format: string | null) {
        const regex = new RegExp('^' + key.replace(/\*/g, '.*') + '$')
        const result: Record<string, string[]> = {}
        for (const [messageKey, messages] of Object.entries(this.messages)) {
            if (regex.test(messageKey)) {
                result[messageKey] = this.transform(messages, this.checkFormat(format), messageKey)
            }
        }
        return result
    }

    /**
     * Get all messages.
     */
    all (format: string | null = null): string[] {
        const fmt = this.checkFormat(format)
        const all: string[] = []
        for (const [key, messages] of Object.entries(this.messages)) {
            all.push(...this.transform(messages, fmt, key))
        }
        return all
    }

    /**
     * Get unique messages.
     */
    unique (format: string | null = null): string[] {
        return Array.from(new Set(this.all(format)))
    }

    /**
     * Remove messages for a key.
     */
    forget (key: string): this {
        delete this.messages[key]
        return this
    }

    /**
     * Format an array of messages.
     */
    protected transform (messages: string[], format: string, messageKey: string): string[] {
        if (format === ':message') return messages
        return messages.map(m => format.replace(':message', m).replace(':key', messageKey))
    }

    /**
     * Get proper format string.
     */
    protected checkFormat (format?: string | null): string {
        return format || this.format
    }

    /**
     * Get raw messages.
     */
    messagesRaw (): Record<string, string[]> {
        return this.messages
    }

    /**
     * Alias for messagesRaw().
     */
    getMessages (): Record<string, string[]> {
        return this.messagesRaw()
    }

    /**
     * Return message bag instance.
     */
    getMessageBag (): MessageBag {
        return this
    }

    /**
     * Get format string.
     */
    getFormat (): string {
        return this.format
    }

    /**
     * Set default message format.
     */
    setFormat (format = ':message'): this {
        this.format = format
        return this
    }

    /**
     * Empty checks.
     */
    isEmpty (): boolean {
        return !this.any()
    }

    isNotEmpty (): boolean {
        return this.any()
    }

    any (): boolean {
        return this.count() > 0
    }

    /**
     * Count total messages.
     */
    count (): number {
        return Object.values(this.messages).reduce((sum, list) => sum + list.length, 0)
    }

    /**
     * Array & JSON conversions.
     */
    toArray (): Record<string, string[]> {
        return this.getMessages()
    }

    jsonSerialize (): any {
        return this.toArray()
    }

    toJson (options = 0): string {
        return JSON.stringify(this.jsonSerialize(), null, options ? 2 : undefined)
    }

    toPrettyJson (): string {
        return JSON.stringify(this.jsonSerialize(), null, 2)
    }

    /**
     * String representation.
     */
    toString (): string {
        return this.toJson()
    }
}