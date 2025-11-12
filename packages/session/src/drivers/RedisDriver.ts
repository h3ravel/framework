import { Encryption } from '../Encryption'
import { SessionDriver } from '../Contracts/SessionContract'

/**
 * RedisDriver (placeholder)
 */
export class RedisDriver implements SessionDriver {
    private store: Record<string, string | Record<string, string>> = {}
    private encryptor = new Encryption()

    constructor(
        /**
         * The current session ID
         */
        private sessionId: string,
        private redisClient?: 'RedisClient',
        private prefix?: string
    ) { }

    get (key: string, defaultValue: any = null) {
        return defaultValue
    }

    set (key: string, value: any) { }

    all () {
        return {}
    }

    put (values: Record<string, any>) { }

    push (key: string, value: any) { }

    forget (key: string) { }

    flush () { }
}