import { HashConfiguration, HashInfo, IBcryptHasher } from '@h3ravel/contracts'
import { InvalidArgumentException, RuntimeException } from '@h3ravel/support'

import { AbstractHasher } from './AbstractHasher'
import bcrypt from 'bcryptjs'
import { mix } from '@h3ravel/shared'

export class BcryptHasher extends mix(AbstractHasher, IBcryptHasher) {
    private rounds: number = 12
    private verifyAlgorithm: boolean = true
    private limit: number | null = null

    constructor(options = {} as HashConfiguration['bcrypt']) {
        super()
        this.rounds = options.rounds ?? this.rounds
        this.verifyAlgorithm = options.verify ?? process.env.HASH_VERIFY ?? this.verifyAlgorithm
        this.limit = options.limit ?? this.limit
    }

    /**
     * Hash the given value.
     *
     * @param  value
     * @param  options
     * 
     * @return {String}
     */
    public async make (value: string, options = {} as HashConfiguration['bcrypt']): Promise<string> {
        if (this.limit && value.length > this.limit) {
            throw new InvalidArgumentException(`Value is too long to hash. Value must be less than ${this.limit} bytes`)
        }

        try {
            const salt = await bcrypt.genSalt(this.cost(options))
            return await bcrypt.hash(value, salt)
        } catch {
            throw new RuntimeException('Bcrypt hashing not supported.')
        }
    }

    /**
     * Check the given plain value against a hash.
     *
     * @param  value
     * @param  hashedValue
     * @param  options
     * @returns
     */
    public async check (value: string, hashedValue?: string | null, _options = {} as HashConfiguration['bcrypt']) {
        if (!hashedValue || hashedValue.length === 0) {
            return false
        }

        if (this.verifyAlgorithm && !this.isUsingCorrectAlgorithm(hashedValue)) {
            throw new RuntimeException('This password does not use the Bcrypt algorithm.')
        }

        return bcrypt.compare(value, hashedValue)
    }

    /**
     * Get information about the given hashed value.
     *
     * @param  hashedValue
     * 
     * @return {Object}
     */
    public info (hashedValue: string): HashInfo {
        return super.info(hashedValue)
    }

    /**
     * Check if the given hash has been hashed using the given options.
     *
     * @param  hashedValue
     * @param  options
     * 
     * @return {Boolean}
     */
    public needsRehash (hashedValue: string, options = {} as HashConfiguration['bcrypt']): boolean {
        const match = hashedValue.match(/^\$2[aby]?\$(\d+)\$/)
        if (!match) return true

        const currentRounds = parseInt(match[1], 10)
        return currentRounds !== this.cost(options)
    }

    /**
     * Verify the hashed value's options.
     *
     * @param  hashedValue
     * @return
     */
    protected isUsingValidOptions (hashedValue: string) {
        const { options } = this.info(hashedValue)

        if (!options.cost || !Number.isInteger(options.cost ?? null)) {
            return false
        }

        if (options.cost > this.rounds) {
            return false
        }

        return true
    }

    /**
     * Verifies that the configuration is less than or equal to what is configured.
     *
     * @private
     */
    public verifyConfiguration (value: string) {
        return this.isUsingCorrectAlgorithm(value) && this.isUsingValidOptions(value)
    }

    /**
     * Verify the hashed value's algorithm.
     *
     * @param  hashedValue
     * 
     * @returns
     */
    protected isUsingCorrectAlgorithm (hashedValue: string) {
        return this.info(hashedValue)['algoName'] === 'bcrypt'
    }

    /**
     * Extract the cost value from the options object.
     *
     * @param  options
     * @return int
     */
    protected cost (options = {} as HashConfiguration['bcrypt']) {
        return options.rounds ?? this.rounds
    }
}
