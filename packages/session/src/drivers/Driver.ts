import { safeDot, setNested } from 'packages/support/dist'

import { Encryption } from '../Encryption'
import { FlashBag } from '../FlashBag'
import { SessionDriver } from '../Contracts/SessionContract'

/**
 * Driver
 *
 * Base Session driver.
 */
export abstract class Driver implements SessionDriver {
    protected encryptor = new Encryption()
    protected sessionId!: string
    public flashBag: FlashBag = new FlashBag()

    constructor() {
    }

    /** 
     * Invalidate session completely and regenerate empty session. 
     */
    public abstract invalidate (): void

    /**
     * Fetch current payload
     * 
     * @returns 
     */
    protected abstract fetchPayload<T extends Record<string, any>> (loadFlash?: boolean): T | Promise<T>

    /**
     * Save updated payload
     * 
     * @param payload 
     */
    protected abstract savePayload (payload: Record<string, any>): void | Promise<void>

    /**
     * Save the raw session payload (session + flash)
     */
    private saveRawPayload () {
        this.savePayload(Object.assign({}, this.fetchPayload(), { _flash: this.flashBag.raw() }))
    }

    /**
     * Retrieve all data from the session including flash
     * 
     * @returns 
     */
    getAll<T = any> (): T | Promise<T> {
        const payload = this.fetchPayload() as Record<string, any>
        const flash = payload._flash ?? { old: {}, new: {} }
        return { ...payload, ...flash.old, ...flash.new }
    }

    /**
     * Retrieve a value from the session
     * 
     * @param key 
     * @param defaultValue 
     * @returns 
     */
    get<T = any> (key: string, defaultValue?: any): T | Promise<T> {
        const payload = this.getAll() as Record<string, any>
        return safeDot(payload, key) || defaultValue
    }

    /** 
     * Store a value in the session
     * 
     * @param key 
     * @param value 
     */
    set (value: Record<string, any>): void | Promise<void> {
        const payload = this.fetchPayload()
        Object.assign(payload, value)
        return this.savePayload(payload)
    }

    /** 
     * Store multiple key/value pairs
     * 
     * @param values 
     */
    put (key: string, value: any): void | Promise<void> {
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
    push (key: string, value: any): void | Promise<void> {
        const payload = this.fetchPayload() as Record<string, any>
        if (!Array.isArray(payload[key])) payload[key] = []
        payload[key].push(value)
        return this.savePayload(payload)
    }

    /** 
     * Remove a key from the session
     * 
     * @param key 
     */
    forget (key: string): void | Promise<void> {
        const payload = this.fetchPayload() as Record<string, any>
        delete payload[key]
        return this.savePayload(payload)
    }

    /** 
     * Retrieve all session data
     * 
     * @returns 
     */
    all<T extends Record<string, any>> (): T | Promise<T> {
        return this.fetchPayload() as T
    }

    /** 
     * Determine if a key exists (even if null).
     * 
     * @param key 
     * @returns 
     */
    exists (key: string): boolean | Promise<boolean> {
        const data = this.getAll()
        return Object.prototype.hasOwnProperty.call(data, key)
    }

    /** 
     * Determine if a key has a non-null value.
     * 
     * @param key 
     * @returns 
     */
    has (key: string): boolean | Promise<boolean> {
        const data = this.getAll() as Record<string, any>
        return data[key] !== undefined && data[key] !== null
    }

    /**
     * Get only specific keys.
     * 
     * @param keys 
     * @returns 
     */
    only<T extends Record<string, any>> (keys: string[]): T | Promise<T> {
        const data = this.fetchPayload() as Record<string, any>
        const result: Record<string, any> = {}
        keys.forEach(k => {
            if (k in data) result[k] = data[k]
        })
        return result as T
    }

    /**
     * Return all keys except the specified ones.
     * 
     * @param keys 
     * @returns 
     */
    except<T extends Record<string, any>> (keys: string[]): T | Promise<T> {
        const data = this.fetchPayload() as Record<string, any>
        keys.forEach(k => delete data[k])
        return data as T
    }

    /**
     * Return and delete a key from the session.
     * 
     * @param key 
     * @param defaultValue 
     * @returns 
     */
    pull<T = any> (key: string, defaultValue: any = null): T | Promise<T> {
        const data = this.fetchPayload() as Record<string, any>
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
    increment (key: string, amount = 1): number | Promise<number> {
        const data = this.fetchPayload() as Record<string, any>
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
    decrement (key: string, amount = 1): number | Promise<number> {
        return this.increment(key, -amount)
    }

    /**
     * Flash a value for next request only.
     * 
     * @param key 
     * @param value 
     */
    flash (key: string, value: any): void | Promise<void> {
        this.flashBag.flash(key, value)
        this.saveRawPayload()
    }

    /**
     * Reflash all flash data for one more cycle.
     * 
     * @returns 
     */
    reflash (): void | Promise<void> {
        this.flashBag.reflash()
        this.saveRawPayload()
    }

    /**
     * Keep only selected flash data.
     * 
     * @param keys 
     * @returns 
     */
    keep (keys: string[]): void | Promise<void> {
        this.flashBag.keep(keys)
        this.saveRawPayload()
    }

    /**
     * Store a temporary value (flash) for this request only (not persisted)
     * 
     * @param key 
     * @param value 
     */
    now (key: string, value: any): void | Promise<void> {
        this.flashBag.now(key, value)
        this.saveRawPayload()
    }

    /**
     * Regenerate session ID and persist data under new ID.
     */
    regenerate (): void | Promise<void> {
        const oldData = this.fetchPayload()
        this.sessionId = crypto.randomUUID()
        this.savePayload(oldData)
    }

    /**
     * Age flash data at the end of the request lifecycle.
     */
    ageFlashData (): void | Promise<void> {
        const data = this.flashBag.ageFlashData()
        this.saveRawPayload()
        return data
    }

    /** 
     * Determine if an item is not present in the session. 
     * 
     * @param key 
     * @returns 
     */
    missing (key: string): boolean | Promise<boolean> {
        return !this.exists(key)
    }

    /** 
     * Flush all session data
     */
    flush () {
        return this.savePayload({})
    }
}