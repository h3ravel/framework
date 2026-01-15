import { HashAlgorithm, HashInfo, HashOptions } from './IHashManagerContract'

import { IArgon2idHasher } from './IArgon2idHasher'
import { IArgonHasher } from './IArgonHasher'
import { IBaseHashManager } from './IBaseHashManager'
import { IBcryptHasher } from './IBcryptHasher'

export abstract class IHashManager extends IBaseHashManager {
    /**
     * Create an instance of the Bcrypt hash Driver.
     *
     * @return BcryptHasher
     */
    abstract createBcryptDriver (): IBcryptHasher;

    /**
     * Create an instance of the Argon hash Driver.
     *
     * @return ArgonHasher
     */
    abstract createArgonDriver (): IArgonHasher;

    /**
     * Create an instance of the Argon2id hash Driver.
     *
     * @return Argon2idHasher
     */
    abstract createArgon2idDriver (): IArgon2idHasher;

    /**
     * Hash the given value.
     *
     * @param  value
     * @param options
     *
     * @returns
     */
    abstract make (value: string, options?: HashOptions): Promise<string>;

    /**
     * Get information about the given hashed value.
     *
     * @param  hashedValue
     * @returns
     */
    abstract info (hashedValue: string): HashInfo;

    /**
     * Check the given plain value against a hash.
     *
     * @param  value
     * @param  hashedValue
     * @param options
     * @returns
     */
    abstract check (value: string, hashedValue?: string, options?: HashOptions): Promise<boolean>;

    /**
     * Check if the given hash has been hashed using the given options.
     *
     * @param  hashedValue
     * @param options
     * @returns
     */
    abstract needsRehash (hashedValue: string, options?: HashOptions): boolean;

    /**
     * Determine if a given string is already hashed.
     *
     * @param  string  value
     * @returns
     */
    abstract isHashed (value: string): boolean;

    /**
     * Verifies that the configuration is less than or equal to what is configured.
     *
     * @param  value
     *
     * @internal
     */
    abstract verifyConfiguration (value: string): boolean;

    /**
     * Get a driver instance.
     *
     * @param  driver
     *
     * @throws {InvalidArgumentException}
     */
    abstract driver (driver?: HashAlgorithm): IArgonHasher | IArgon2idHasher | IBcryptHasher;
}