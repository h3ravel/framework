import { Driver } from './Driver'
import { SessionDriver } from '../Contracts/SessionContract'

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
     * Read and decrypt session data from file.
     */
    protected fetchPayload (): Record<string, any> {
        return { ...MemoryDriver.store[this.sessionId] }
    }

    /**
     * Write and encrypt session data to file.
     */
    protected savePayload (data: Record<string, any>): void {
        MemoryDriver.store[this.sessionId] = Object.entries(data).length < 1 ? {} : {
            ...MemoryDriver.store[this.sessionId],
            ...data,
        }
    }

    /** 
     * Invalidate session completely and regenerate empty session. 
     */
    invalidate () {
        delete MemoryDriver.store[this.sessionId]
        this.sessionId = crypto.randomUUID()
        this.savePayload({})
    }
}
