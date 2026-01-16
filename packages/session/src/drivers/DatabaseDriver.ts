import { safeDot, setNested } from '@h3ravel/support'

import { DB } from '@h3ravel/database'
import { Driver } from './Driver'
import { FlashBag } from '../FlashBag'
import { ISessionDriver } from '@h3ravel/contracts'

/**
 * DatabaseDriver
 *
 * Stores sessions in a database table. Each session ID maps to a row.
 * The `payload` column contains all session key/value pairs as JSON.
 */
export class DatabaseDriver extends Driver implements ISessionDriver {
    /**
     * 
     * @param sessionId The current session ID
     * @param table 
     */
    constructor(protected sessionId: string, private table: string = 'sessions') {
        super()
    }

    /**
     * Get the query builder for this table
     */
    private query () {
        return DB.table(this.table).where('id', this.sessionId)
    }

    /**
     * Fetch the session payload
     */
    protected async fetchPayload<T extends Record<string, any>> (): Promise<T> {
        const row = await this.query().first()
        if (!row) return {} as T

        try {
            const decrypted = this.encryptor.decrypt(row.payload)
            const payload = typeof decrypted === 'string' ? JSON.parse(decrypted) : decrypted

            // Merge flash data with payload
            return payload
        } catch {
            return {} as T
        }
    }

    /**
     * Save the session payload back to DB
     */
    protected async savePayload (payload: Record<string, any>) {
        // Remove flash data before saving
        // const { _flash, ...persistentPayload } = payload

        const now = Math.floor(Date.now() / 1000)
        const exists = await this.query().exists()

        const encrypted = this.encryptor.encrypt(JSON.stringify(payload))

        if (exists) {
            await this.query().update({ payload: encrypted, last_activity: now })
        } else {
            await DB.table(this.table).insert({
                id: this.sessionId,
                payload: encrypted,
                last_activity: now,
            })
        }
    }

    /**
     * Retrieve all data from the session including flash
     */
    async getAll<T = any> (): Promise<T> {
        const payload = await this.fetchPayload()
        const flash = payload._flash ?? { old: {}, new: {} }
        return { ...payload, ...flash.old, ...flash.new }
    }

    /**
     * Get a value from the session
     */
    async get<T = any> (key: string, defaultValue?: any): Promise<T> {
        const payload = await this.getAll()
        return safeDot(payload, key) || defaultValue
    }

    /**
     * Set one or multiple session values
     */
    async set (values: Record<string, any>): Promise<void> {
        const payload = await this.fetchPayload()
        Object.assign(payload, values)
        await this.savePayload(payload)
    }

    /**
     * Store a single key/value pair
     */
    async put (key: string, value: any): Promise<void> {
        const payload = await this.fetchPayload()
        setNested(payload, key, value)
        await this.savePayload(payload)
    }

    /**
     * Append a value to an array key
     */
    async push (key: string, value: any): Promise<void> {
        const payload = await this.fetchPayload()
        if (!Array.isArray(payload[key])) payload[key] = []
        payload[key].push(value)
        await this.savePayload(payload)
    }

    /**
     * Forget a session key
     */
    async forget (key: string): Promise<void> {
        const payload = await this.fetchPayload()
        delete payload[key]
        await this.savePayload(payload)
    }

    /**
     * Retrieve all session data (excluding flash)
     */
    async all<T extends Record<string, any>> (): Promise<T> {
        return this.fetchPayload()
    }

    /**
     * Determine if a key exists (even if null)
     */
    async exists (key: string): Promise<boolean> {
        const data = await this.getAll()
        return Object.prototype.hasOwnProperty.call(data, key)
    }

    /**
     * Determine if a key has a non-null value
     */
    async has (key: string): Promise<boolean> {
        const data = await this.getAll()
        return data[key] !== undefined && data[key] !== null
    }

    /**
     * Get only specific keys
     */
    async only<T extends Record<string, any>> (keys: string[]): Promise<T> {
        const data = await this.fetchPayload()
        const result: Record<string, any> = {}
        keys.forEach(k => {
            if (k in data) result[k] = data[k]
        })
        return result as T
    }

    /**
     * Return all except specific keys
     */
    async except<T extends Record<string, any>> (keys: string[]): Promise<T> {
        const data = await this.fetchPayload()
        keys.forEach(k => delete data[k])
        return data as T
    }

    /**
     * Retrieve and delete a value
     */
    async pull (key: string, defaultValue: any = null) {
        const data = await this.fetchPayload()
        const value = data[key] ?? defaultValue
        delete data[key]
        await this.savePayload(data)
        return value
    }

    /**
     * Increment a numeric value
     */
    async increment (key: string, amount = 1) {
        const data = await this.fetchPayload()
        const newVal = (parseFloat(data[key]) || 0) + amount
        data[key] = newVal
        await this.savePayload(data)
        return newVal
    }

    /**
     * Decrement a numeric value
     */
    async decrement (key: string, amount = 1) {
        return this.increment(key, -amount)
    }

    /**
     * Flash a value for next request only
     */
    async flash (key: string, value: any) {
        this.flashBag.flash(key, value)
    }

    /**
     * Reflash all flash data for one more cycle
     */
    async reflash () {
        this.flashBag.reflash()
    }

    /**
     * Keep only specific flash keys
     */
    async keep (keys: string[]) {
        this.flashBag.keep(keys)
    }

    /**
     * Store a temporary value (flash) for this request only (not persisted)
     */
    async now (key: string, value: any) {
        this.flashBag.now(key, value)
    }

    /**
     * Regenerate session ID with same data
     */
    async regenerate () {
        const oldData = await this.fetchPayload()
        this.sessionId = crypto.randomUUID()
        await this.savePayload(oldData)
    }

    /**
     * Check if a key is missing
     */
    async missing (key: string): Promise<boolean> {
        return !(await this.exists(key))
    }

    /**
     * Flush all session data
     */
    async flush (): Promise<void> {
        await this.savePayload({})
    }

    /**
     * Invalidate the session and regenerate
     */
    async invalidate () {
        await DB.table(this.table).where('id', this.sessionId).delete()
        this.sessionId = crypto.randomUUID()
        this.flashBag = new FlashBag()
        await this.savePayload({})
    }

    /**
     * Age flash data at the end of the request lifecycle.
     */
    async ageFlashData (): Promise<void> {
        this.flashBag.ageFlashData()
    }
}
