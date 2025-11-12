import { SessionDriver } from '../Contracts/SessionContract'

/**
 * MemoryDriver
 *
 * Lightweight, ephemeral session storage.
 * Intended for tests, local development, or short-lived apps.
 */
export class MemoryDriver implements SessionDriver {
    private static store: Record<string, Record<string, any>> = {}
    private sessionId: string

    constructor(sessionId: string) {
        this.sessionId = sessionId
        if (!MemoryDriver.store[this.sessionId]) {
            MemoryDriver.store[this.sessionId] = {}
        }
    }

    get (key: string): any {
        return MemoryDriver.store[this.sessionId][key]
    }

    set (key: string, value: any): void {
        MemoryDriver.store[this.sessionId][key] = value
    }

    put (data: Record<string, any>): void {
        MemoryDriver.store[this.sessionId] = {
            ...MemoryDriver.store[this.sessionId],
            ...data,
        }
    }

    push (key: string, value: any): void {
        const existing = MemoryDriver.store[this.sessionId][key] || []
        if (!Array.isArray(existing)) throw new Error(`Cannot push to non-array key: ${key}`)
        existing.push(value)
        MemoryDriver.store[this.sessionId][key] = existing
    }

    forget (key: string): void {
        delete MemoryDriver.store[this.sessionId][key]
    }

    all (): Record<string, any> {
        return { ...MemoryDriver.store[this.sessionId] }
    }

    flush (): void {
        MemoryDriver.store[this.sessionId] = {}
    }
}
