import { HashConfiguration, HashInfo } from './IHashManagerContract'

import { IAbstractHasher } from './IAbstractHasher'

export abstract class IArgonHasher extends IAbstractHasher {
    /**
     * Hash the given value using Argon2i.
     */
    abstract make (value: string, options?: HashConfiguration['argon']): Promise<string>;

    /**
     * Check the given plain value against a hash.
     */
    abstract check (value: string, hashedValue?: string | null, _options?: HashConfiguration['argon']): Promise<boolean>;

    /**
     * Get information about the given hashed value.
     */
    abstract info (hashedValue: string): HashInfo;

    /**
     * Check if the given hash needs to be rehashed based on current options.
     */
    abstract needsRehash (hashedValue: string, options?: HashConfiguration['argon']): boolean;

    /**
     * Verify that the hash configuration does not exceed the configured limits.
     */
    abstract verifyConfiguration (hashedValue: string): boolean;

    /**
     * Verify the hashed value's options.
     */
    protected abstract isUsingValidOptions (hashedValue: string): boolean;

    /**
     * Verify the hashed value's algorithm.
     */
    protected abstract isUsingCorrectAlgorithm (hashedValue: string): boolean;

    /**
     * Extract Argon parameters from the hash.
     */
    protected abstract parseInfo (hashedValue: string): Record<string, number | undefined>;
}
