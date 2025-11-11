/**
 * RateLimiterAdapter types
 */

export type LimitSpec = {
    key?: string
    maxAttempts: number
    decaySeconds: number
}

export type Unlimited = {
    unlimited: true
}

/**
 * Rate Limiter Adapter Interface
 */
export interface RateLimiterAdapter {
    /**
     * Attempt a key with a maxAttempts and decaySeconds.
     *
     * Return true if this is allowed (i.e., *not* throttled),
     * false if the limit is reached.
     */
    attempt (
        key: string,
        maxAttempts: number,
        allowCallback: () => boolean | Promise<boolean>,
        decaySeconds: number
    ): Promise<boolean>
}