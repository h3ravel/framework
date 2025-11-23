import { Driver } from './Driver'
import { FlashBag } from '../FlashBag'
import { SessionDriver } from '../Contracts/SessionContract'
import crypto from 'crypto'

/**
 * MemoryDriver
 *
 * Lightweight, ephemeral session storage.
 * Intended for tests, local development, or short-lived apps.
 */
export class MemoryDriver extends Driver implements SessionDriver {
    private static store: Record<string, Record<string, any>> = {}

    constructor(protected sessionId: string) {
        super()
        this.sessionId = sessionId
        if (!MemoryDriver.store[this.sessionId]) {
            MemoryDriver.store[this.sessionId] = {}
        }
    }

    /**
     * Fetch and return session payload.
     * 
     * @returns Decrypted and usable payload
     */
    protected fetchPayload (): Record<string, any> {
        const payload = { ...MemoryDriver.store[this.sessionId] }

        // Merge flash data with payload
        return payload
    }

    /**
     * Persist session payload and flash bag state.
     * 
     * @param data 
     */
    protected savePayload (payload: Record<string, any>): void {
        // Remove flash data before saving
        // const { _flash, ...persistentPayload } = payload

        MemoryDriver.store[this.sessionId] = { ...payload }
    }

    /**
     * Invalidate current session and regenerate new session ID.
     */
    invalidate (): void {
        delete MemoryDriver.store[this.sessionId]
        this.sessionId = crypto.randomUUID()
        this.flashBag = new FlashBag()
        this.savePayload({})
    }
}
