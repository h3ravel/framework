import { HashOptions, IHashManager } from '@h3ravel/contracts'

import { Hash as HashFacade } from '@h3ravel/support/facades'
import { RuntimeException } from '@h3ravel/support'

export class Hash {
    /**
     * Hash the given value.
     *
     * @param  value
     * @param options
     * 
     * @returns
     */
    public static make (value: string, options: HashOptions = {}) {
        return this.driver().make(value, options)
    }

    /**
     * Get information about the given hashed value.
     *
     * @param  hashedValue
     * @returns
     */
    public static info (hashedValue: string) {
        return this.driver().info(hashedValue)
    }

    /**
     * Check the given plain value against a hash.
     *
     * @param  value
     * @param  hashedValue
     * @param options
     * @returns
     */
    public static check (value: string, hashedValue?: string, options: HashOptions = {}) {
        return this.driver().check(value, hashedValue, options)
    }

    /**
     * Check if the given hash has been hashed using the given options.
     *
     * @param  hashedValue
     * @param options
     * @returns
     */
    public static needsRehash (hashedValue: string, options: HashOptions = {}) {
        return this.driver().needsRehash(hashedValue, options)
    }

    /**
     * Determine if a given string is already hashed.
     *
     * @param  string  value
     * @returns
     */
    public static isHashed (value: string) {
        return this.driver().isHashed(value)
    }

    /**
     * Verifies that the configuration is less than or equal to what is configured.
     *
     * @param  value
     * @return bool
     *
     * @internal
     */
    public static verifyConfiguration (value: string) {
        return this.driver().verifyConfiguration(value)
    }

    /**
     * Get a driver instance.
     *
     * @param  driver
     * 
     * @returns
     *
     * @throws {RuntimeException}
     */
    public static driver (): IHashManager {
        if (typeof Hash === 'undefined') {
            throw new RuntimeException('The Hash helper is only available on H3ravel, use the HashManager class instead.')
        }
        return HashFacade
    }
}
