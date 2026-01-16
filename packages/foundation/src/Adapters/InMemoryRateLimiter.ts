import { RateLimiterAdapter } from '@h3ravel/contracts'

/**
 * Very small in-memory token-bucket / counter limiter.
 *
 * Suitable for single-process dev / tests. We will replace with a Redis-backed adapter
 * implementing `RateLimiterAdapter` in future.
 */
export class InMemoryRateLimiter implements RateLimiterAdapter {
    /* A map of key -> { count, expiresAt } */
    protected store = new Map<string, { count: number; expiresAt: number }>()

    public async attempt (key: string, maxAttempts: number, allowCallback: () => boolean | Promise<boolean>, decaySeconds: number): Promise<boolean> {
        const now = Date.now()
        const record = this.store.get(key)

        if (!record || record.expiresAt <= now) {
            this.store.set(key, { count: 1, expiresAt: now + decaySeconds * 1000 })
            return await allowCallback()
        }

        if (record.count < maxAttempts) {
            record.count++
            this.store.set(key, record)
            return await allowCallback()
        }

        // limit reached
        return false
    }
}