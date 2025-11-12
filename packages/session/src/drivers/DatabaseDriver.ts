import { safeDot, setNested } from '@h3ravel/support'

import { DB } from '@h3ravel/database'
import { Driver } from './Driver'
import { SessionDriver } from '../Contracts/SessionContract'

/**
 * DatabaseDriver
 *
 * Stores sessions in a database table. Each session ID maps to a row.
 * The `payload` column contains all session key/value pairs as JSON.
 */
export class DatabaseDriver extends Driver implements SessionDriver {
    constructor(
        /**
         * The current session ID
         */
        protected sessionId: string,
        private table: string = 'sessions'
    ) {
        super()
    }

    /**
     * Helper: get the query builder for this table.
     */
    private query () {
        return DB.table(this.table).where('id', this.sessionId)
    }

    /**
     * Fetch current payload
     * 
     * @returns 
     */
    protected async fetchPayload (): Promise<Record<string, any>> {
        const row = await this.query().first()

        if (!row) return {}

        try {
            const encrypted = row.payload

            if (!encrypted) return {}
            const decrypted = this.encryptor.decrypt(encrypted)
            return typeof decrypted === 'string' ? JSON.parse(decrypted) : decrypted
        } catch {
            return {}
        }
    }

    /**
     * Save updated payload
     * 
     * @param payload 
     */
    protected async savePayload (payload: Record<string, any>) {
        const now = Math.floor(Date.now() / 1000)
        const exists = await this.query().exists()
        const encrypted = this.encryptor.encrypt(JSON.stringify(payload))

        if (exists) {
            await this.query().update({
                payload: encrypted,
                last_activity: now,
            })
        } else {
            await DB.table(this.table).insert({
                id: this.sessionId,
                payload: encrypted,
                last_activity: now,
            })
        }
    }

    /**
     * Retrieve a value from the session
     * 
     * @param key 
     * @param defaultValue 
     * @returns 
     */
    async get (key: string, defaultValue?: any): Promise<any> {
        const payload = await this.fetchPayload()
        return safeDot(payload, key) || defaultValue
    }

    /** 
     * Store a value in the session
     * 
     * @param key 
     * @param value 
     */
    async set (value: Record<string, any>): Promise<void> {
        const payload = await this.fetchPayload()
        Object.assign(payload, value)
        await this.savePayload(payload)
    }

    /** 
     * Store multiple key/value pairs
     * 
     * @param values 
     */
    async put (key: string, value: any): Promise<void> {
        const payload = await this.fetchPayload()
        setNested(payload, key, value)
        await this.savePayload(payload)
    }

    /** 
     * Append a value to an array key
     * 
     * @param key 
     * @param value 
     */
    async push (key: string, value: any): Promise<void> {
        const payload = await this.fetchPayload()
        if (!Array.isArray(payload[key])) payload[key] = []
        payload[key].push(value)
        await this.savePayload(payload)
    }

    /** 
     * Remove a key from the session
     * 
     * @param key 
     */
    async forget (key: string): Promise<void> {
        const payload = await this.fetchPayload()
        delete payload[key]
        await this.savePayload(payload)
    }

    /** 
     * Retrieve all session data
     * 
     * @returns 
     */
    async all (): Promise<Record<string, any>> {
        return await this.fetchPayload()
    }

    /** 
     * Determine if a key exists (even if null).
     * 
     * @param key 
     * @returns 
     */
    async exists (key: string) {
        const data = await this.fetchPayload()
        return Object.prototype.hasOwnProperty.call(data, key)
    }

    /** 
     * Determine if a key has a non-null value.
     * 
     * @param key 
     * @returns 
     */
    async has (key: string) {
        const data = await this.fetchPayload()
        return data[key] !== undefined && data[key] !== null
    }

    /**
     * Get only specific keys.
     * 
     * @param keys 
     * @returns 
     */
    async only (keys: string[]) {
        const data = await this.fetchPayload()
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
    async except (keys: string[]) {
        const data = await this.fetchPayload()
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
    async pull (key: string, defaultValue: any = null) {
        const data = await this.fetchPayload()
        const value = data[key] ?? defaultValue
        delete data[key]
        await this.savePayload(data)
        return value
    }

    /**
     * Increment a numeric value by amount (default 1).
     * 
     * @param key 
     * @param amount 
     * @returns 
     */
    async increment (key: string, amount = 1) {
        const data = await this.fetchPayload()
        const newVal = (parseFloat(data[key]) || 0) + amount
        data[key] = newVal
        await this.savePayload(data)
        return newVal
    }

    /**
     * Decrement a numeric value by amount (default 1).
     * 
     * @param key 
     * @param amount 
     * @returns 
     */
    async decrement (key: string, amount = 1) {
        return this.increment(key, -amount)
    }

    /**
     * Flash a value for next request only.
     * 
     * @param key 
     * @param value 
     */
    async flash (key: string, value: any) {
        const data = await this.fetchPayload()
        data._flash = data._flash || {}
        data._flash[key] = value
        await this.savePayload(data)
    }

    /**
     * Reflash all flash data for one more cycle.
     * 
     * @returns 
     */
    async reflash () {
        const data = await this.fetchPayload()
        if (!data._flash) return
        data._flash_keep = { ...data._flash }
        await this.savePayload(data)
    }

    /**
     * Keep only selected flash data.
     * 
     * @param keys 
     * @returns 
     */
    async keep (keys: string[]) {
        const data = await this.fetchPayload()
        if (!data._flash) return
        const kept: Record<string, any> = {}
        keys.forEach(k => {
            if (data._flash[k]) kept[k] = data._flash[k]
        })
        data._flash_keep = kept
        await this.savePayload(data)
    }

    /**
     * Store data only for current request cycle (not persisted).
     * 
     * @param key 
     * @param value 
     */
    async now (key: string, value: any) {
        // Not persisted to DB — use in-memory only.
        ; (global as any).__session_now = (global as any).__session_now || {}
            ; (global as any).__session_now[key] = value
    }

    /**
     * Regenerate session ID and persist data under new ID.
     */
    async regenerate () {
        const oldData = await this.fetchPayload()
        this.sessionId = crypto.randomUUID()
        await this.savePayload(oldData)
    }

    /** 
     * Determine if an item is not present in the session. 
     * 
     * @param key 
     * @returns 
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
     * Invalidate session completely and regenerate empty session. 
     */
    async invalidate () {
        await DB.table(this.table).where('id', this.sessionId).delete()
        this.sessionId = crypto.randomUUID()
        await this.savePayload({})
    }
}