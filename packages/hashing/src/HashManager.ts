import { Configuration, HashAlgorithm, Options } from './Contracts/ManagerContract'

import { Argon2idHasher } from './Drivers/Argon2idHasher'
import { ArgonHasher } from './Drivers/ArgonHasher'
import { BcryptHasher } from './Drivers/BcryptHasher'
import { InvalidArgumentException } from '@h3ravel/support'
import { Manager } from './Utils/Manager'

export class HashManager extends Manager {
    private drivers: { [name: string]: BcryptHasher | ArgonHasher | Argon2idHasher } = {}

    /**
     * Create an instance of the Bcrypt hash Driver.
     *
     * @return BcryptHasher
     */
    public createBcryptDriver () {
        return new BcryptHasher(this.config[this.config.driver])
    }

    /**
     * Create an instance of the Argon hash Driver.
     *
     * @return ArgonHasher
     */
    public createArgonDriver () {
        return new ArgonHasher(this.config[this.config.driver])
    }

    /**
     * Create an instance of the Argon2id hash Driver.
     *
     * @return Argon2idHasher
     */
    public createArgon2idDriver () {
        return new Argon2idHasher(this.config[this.config.driver])
    }

    /**
     * Hash the given value.
     *
     * @param  value
     * @param options
     * 
     * @returns
     */
    public make (value: string, options: Options = {}) {
        return this.driver().make(value, options as never)
    }

    /**
     * Get information about the given hashed value.
     *
     * @param  hashedValue
     * @returns
     */
    public info (hashedValue: string) {
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
    public check (value: string, hashedValue?: string, options: Options = {}) {
        return this.driver().check(value, hashedValue, options as never)
    }

    /**
     * Check if the given hash has been hashed using the given options.
     *
     * @param  hashedValue
     * @param options
     * @returns
     */
    public needsRehash (hashedValue: string, options: Options = {}) {
        return this.driver().needsRehash(hashedValue, options as never)
    }

    /**
     * Determine if a given string is already hashed.
     *
     * @param  string  value
     * @returns
     */
    public isHashed (value: string) {
        return this.driver().info(value)['algo'] !== null
    }

    /**
     * Verifies that the configuration is less than or equal to what is configured.
     *
     * @param  value
     * @return bool
     *
     * @internal
     */
    public verifyConfiguration (value: string) {
        const driver = this.driver()

        if (typeof driver.verifyConfiguration !== 'undefined') {
            return driver.verifyConfiguration(value)
        }

        return true
    }

    /**
     * Get a driver instance.
     *
     * @param  driver
     * 
     * @returns
     *
     * @throws InvalidArgumentException
     */
    public driver (driver?: HashAlgorithm) {
        driver = driver ?? this.getDefaultDriver()

        if (!driver) {
            throw new InvalidArgumentException(`Unable to resolve NULL driver for ${this.constructor.name}.'`)
        }

        // If the given driver has not been created before, we will create the instances
        // here and cache it so we can return it next time very quickly. If there is
        // already a driver created by this name, we'll just return that instance.
        return this.drivers[driver] ??= this.createDriver(driver)
    }
}

export const defineConfig = (config: Configuration) => {
    return config
}
