import { HashConfiguration, HashInfo } from './IHashManagerContract'

import { IAbstractHasher } from './IAbstractHasher'

export abstract class IBcryptHasher extends IAbstractHasher {
    /**
     * Hash the given value.
     *
     * @param  value
     * @param  options
     */
    abstract make (value: string, options?: HashConfiguration['bcrypt']): Promise<string>;

    /**
     * Check the given plain value against a hash.
     *
     * @param  value
     * @param  hashedValue
     * @param  options
     */
    abstract check (value: string, hashedValue?: string | null, _options?: HashConfiguration['bcrypt']): Promise<boolean>;

    /**
     * Get information about the given hashed value.
     *
     * @param  hashedValue
     */
    abstract info (hashedValue: string): HashInfo;

    /**
     * Check if the given hash has been hashed using the given options.
     *
     * @param  hashedValue
     * @param  options
     */
    abstract needsRehash (hashedValue: string, options?: HashConfiguration['bcrypt']): boolean;

    /**
     * Verify the hashed value's options.
     *
     * @param  hashedValue
     * @return
     */
    protected abstract isUsingValidOptions (hashedValue: string): boolean;

    /**
     * Verifies that the configuration is less than or equal to what is configured.
     *
     * @private
     */
    abstract verifyConfiguration (value: string): boolean;

    /**
     * Verify the hashed value's algorithm.
     *
     * @param  hashedValue
     *
     * @returns
     */
    protected abstract isUsingCorrectAlgorithm (hashedValue: string): boolean;

    /**
     * Extract the cost value from the options object.
     *
     * @param  options
     * @return int
     */
    protected abstract cost (options?: HashConfiguration['bcrypt']): number;
}