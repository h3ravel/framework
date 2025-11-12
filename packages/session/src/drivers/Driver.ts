import { safeDot, setNested } from 'packages/support/dist'

import { Encryption } from '../Encryption'
import { SessionDriver } from '../Contracts/SessionContract'

/**
 * Driver
 *
 * Base Session driver.
 */
export abstract class Driver implements SessionDriver {
    protected encryptor = new Encryption()
    protected sessionId!: string

    /** 
     * Invalidate session completely and regenerate empty session. 
     */
    public abstract invalidate (): void

    /**
     * Fetch current payload
     * 
     * @returns 
     */
    protected abstract fetchPayload (): Record<string, any>

    /**
     * Save updated payload
     * 
     * @param payload 
     */
    protected abstract savePayload (payload: Record<string, any>): void

    /**
     * Retrieve a value from the session
     * 
     * @param key 
     * @param defaultValue 
     * @returns 
     */
    get (key: string, defaultValue?: any): Promise<any> | any {
        const payload = this.fetchPayload() as Record<string, any>
        return safeDot(payload, key) || defaultValue
    }

    /** 
     * Store a value in the session
     * 
     * @param key 
     * @param value 
     */
    set (value: Record<string, any>): Promise<void> | void {
        const payload = this.fetchPayload()
        Object.assign(payload, value)
        return this.savePayload(payload)
    }

    /** 
     * Store multiple key/value pairs
     * 
     * @param values 
     */
    put (key: string, value: any): void {
        const payload = this.fetchPayload()
        setNested(payload, key, value)
        return this.savePayload(payload)
    }

    /** 
     * Append a value to an array key
     * 
     * @param key 
     * @param value 
     */
    push (key: string, value: any): void {
        const payload = this.fetchPayload()
        if (!Array.isArray(payload[key])) payload[key] = []
        payload[key].push(value)
        return this.savePayload(payload)
    }

    /** 
     * Remove a key from the session
     * 
     * @param key 
     */
    forget (key: string) {
        const payload = this.fetchPayload()
        delete payload[key]
        return this.savePayload(payload)
    }

    /** 
     * Retrieve all session data
     * 
     * @returns 
     */
    all () {
        return this.fetchPayload()
    }

    /** 
     * Determine if a key exists (even if null).
     * 
     * @param key 
     * @returns 
     */
    exists (key: string): Promise<boolean> | boolean {
        const data = this.fetchPayload()
        return Object.prototype.hasOwnProperty.call(data, key)
    }

    /** 
     * Determine if a key has a non-null value.
     * 
     * @param key 
     * @returns 
     */
    has (key: string): Promise<boolean> | boolean {
        const data = this.fetchPayload()
        return data[key] !== undefined && data[key] !== null
    }

    /**
     * Get only specific keys.
     * 
     * @param keys 
     * @returns 
     */
    only (keys: string[]) {
        const data = this.fetchPayload()
        const result: Record<string, any> = {}
        keys.forEach(k => {
            if (k in data) result[k] = data[k]
        })
        return result
    }

    /**
     * Return all keys except the specified ones.
     * 
     * @param keys 
     * @returns 
     */
    except (keys: string[]) {
        const data = this.fetchPayload()
        keys.forEach(k => delete data[k])
        return data
    }

    /**
     * Return and delete a key from the session.
     * 
     * @param key 
     * @param defaultValue 
     * @returns 
     */
    pull (key: string, defaultValue: any = null) {
        const data = this.fetchPayload()
        const value = data[key] ?? defaultValue
        delete data[key]
        this.savePayload(data)
        return value
    }

    /**
     * Increment a numeric value by amount (default 1).
     * 
     * @param key 
     * @param amount 
     * @returns 
     */
    increment (key: string, amount = 1): Promise<number> | number {
        const data = this.fetchPayload()
        const newVal = (parseFloat(data[key]) || 0) + amount
        data[key] = newVal
        this.savePayload(data)
        return newVal
    }

    /**
     * Decrement a numeric value by amount (default 1).
     * 
     * @param key 
     * @param amount 
     * @returns 
     */
    decrement (key: string, amount = 1) {
        return this.increment(key, -amount)
    }

    /**
     * Flash a value for next request only.
     * 
     * @param key 
     * @param value 
     */
    flash (key: string, value: any) {
        const data = this.fetchPayload()
        data._flash = data._flash || {}
        data._flash[key] = value
        this.savePayload(data)
    }

    /**
     * Reflash all flash data for one more cycle.
     * 
     * @returns 
     */
    reflash () {
        const data = this.fetchPayload()
        if (!data._flash) return
        data._flash_keep = { ...data._flash }
        this.savePayload(data)
    }

    /**
     * Keep only selected flash data.
     * 
     * @param keys 
     * @returns 
     */
    keep (keys: string[]) {
        const data = this.fetchPayload()
        if (!data._flash) return
        const kept: Record<string, any> = {}
        keys.forEach(k => {
            if (data._flash[k]) kept[k] = data._flash[k]
        })
        data._flash_keep = kept
        this.savePayload(data)
    }

    /**
     * Store data only for current request cycle (not persisted).
     * 
     * @param key 
     * @param value 
     */
    now (key: string, value: any) {
        // Not persisted to DB — use in-memory only.
        ; (global as any).__session_now = (global as any).__session_now || {}
            ; (global as any).__session_now[key] = value
    }

    /**
     * Regenerate session ID and persist data under new ID.
     */
    regenerate () {
        const oldData = this.fetchPayload()
        this.sessionId = crypto.randomUUID()
        this.savePayload(oldData)
    }

    /** 
     * Determine if an item is not present in the session. 
     * 
     * @param key 
     * @returns 
     */
    missing (key: string): Promise<boolean> | boolean {
        return !this.exists(key)
    }

    /** 
     * Flush all session data
     */
    flush () {
        return this.savePayload({})
    }
}