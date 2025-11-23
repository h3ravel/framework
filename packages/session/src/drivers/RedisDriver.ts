import { SessionDriver } from '../Contracts/SessionContract'
import { FlashBag } from '../FlashBag'
import { Driver } from './Driver'

/**
 * RedisDriver (placeholder)
 */
export class RedisDriver extends Driver implements SessionDriver {
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
    protected fetchPayload (): Record<string, any> {
        return {}
    }

    /**
     * Persist session payload and flash bag state.
     * 
     * @param data 
     */
    protected savePayload (payload: Record<string, any>): void {
    }

    /**
     * Invalidate current session and regenerate new session ID.
     */
    invalidate (): void {
        this.flashBag = new FlashBag()
        this.savePayload({})
    }
}