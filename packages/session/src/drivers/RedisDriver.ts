import { Driver } from './Driver'
import { FlashBag } from '../FlashBag'
import { ISessionDriver } from '@h3ravel/contracts'

/**
 * RedisDriver (placeholder)
 */
export class RedisDriver extends Driver implements ISessionDriver {
    private static store: Record<string, Record<string, any>> = {}

    constructor(
        /**
         * The current session ID
         */
        protected sessionId: string,
        protected redisClient?: 'RedisClient',
        protected prefix?: string
    ) {
        super()
    }

    /**
     * Fetch and return session payload.
     * 
     * @returns Decrypted and usable payload
     */
    protected fetchPayload<T extends Record<string, any>> (): T {
        return {} as T
    }

    /**
     * Persist session payload and flash bag state.
     * 
     * @param data 
     */
    protected savePayload (_payload: Record<string, any>): void {
    }

    /**
     * Invalidate current session and regenerate new session ID.
     */
    invalidate (): void {
        this.flashBag = new FlashBag()
        this.savePayload({})
    }
}