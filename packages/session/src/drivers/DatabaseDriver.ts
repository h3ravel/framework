import { DB } from '@h3ravel/database'
import { Encryption } from '../Encryption'
import { SessionDriver } from '../Contracts/SessionContract'

/**
 * DatabaseDriver
 *
 * Stores sessions in a database table. Each session ID maps to a row.
 * The `payload` column contains all session key/value pairs as JSON.
 */
export class DatabaseDriver implements SessionDriver {
    private encryptor = new Encryption()

    constructor(
        /**
         * The current session ID
         */
        private sessionId: string,
        private table: string = 'sessions'
    ) { }

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
    private async fetchPayload (): Promise<Record<string, any>> {
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
    private async savePayload (payload: Record<string, any>) {
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
     * @returns 
     */
    async get (key: string): Promise<any> {
        const payload = await this.fetchPayload()
        return payload[key]
    }

    /** 
     * Store a value in the session
     * 
     * @param key 
     * @param value 
     */
    async set (key: string, value: any): Promise<void> {
        const payload = await this.fetchPayload()
        payload[key] = value
        await this.savePayload(payload)
    }

    /** 
     * Store multiple key/value pairs
     * 
     * @param values 
     */
    async put (values: Record<string, any>): Promise<void> {
        const payload = await this.fetchPayload()
        Object.assign(payload, values)
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
     * Flush all session data
     */
    async flush (): Promise<void> {
        await this.savePayload({})
    }
}