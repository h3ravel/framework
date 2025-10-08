import { Configuration, Info } from '../Contracts/ManagerContract'

import { AbstractHasher } from './AbstractHasher'
import { RuntimeException } from '@h3ravel/support'
import argon from 'argon2'

export class Argon2idHasher extends AbstractHasher {
    private memory: number = 65536
    private verifyAlgorithm: boolean = true
    private threads: number = 1
    private time: number = 4

    constructor(options = {} as Configuration['argon']) {
        super()
        this.memory = options.memory ?? this.memory
        this.verifyAlgorithm = options.verify ?? process.env.HASH_VERIFY ?? this.verifyAlgorithm
        this.threads = options.threads ?? this.threads
        this.time = options.time ?? this.time
    }

    /**
     * Hash the given value using Argon2id.
     */
    public async make (value: string, options = {} as Configuration['argon']): Promise<string> {
        try {
            return await argon.hash(value, {
                type: argon.argon2id,
                memoryCost: options.memory ?? this.memory,
                timeCost: options.time ?? this.time,
                parallelism: options.threads ?? this.threads,
            })
        } catch {
            throw new RuntimeException('Argon2id hashing not supported.')
        }
    }

    /**
     * Check the given plain value against a hash.
     */
    public async check (
        value: string,
        hashedValue?: string | null,
        _options = {} as Configuration['argon']
    ): Promise<boolean> {
        if (!hashedValue || hashedValue.length === 0) {
            return false
        }

        if (this.verifyAlgorithm && !this.isUsingCorrectAlgorithm(hashedValue)) {
            throw new RuntimeException('This password does not use the Argon2id algorithm.')
        }

        try {
            return await argon.verify(hashedValue, value)
        } catch {
            return false
        }
    }

    /**
     * Get information about the given hashed value.
     */
    public info (hashedValue: string): Info {
        return super.info(hashedValue)
    }

    /**
     * Check if the given hash needs to be rehashed based on current options.
     */
    public needsRehash (hashedValue: string, options = {} as Configuration['argon']): boolean {
        const parsed = this.parseInfo(hashedValue)
        if (!parsed) return true

        const { memoryCost, timeCost, threads } = parsed

        return (
            memoryCost !== (options.memory ?? this.memory) ||
            timeCost !== (options.time ?? this.time) ||
            threads !== (options.threads ?? this.threads)
        )
    }

    /**
     * Verify that the hash configuration does not exceed the configured limits.
     */
    public verifyConfiguration (hashedValue: string): boolean {
        return this.isUsingCorrectAlgorithm(hashedValue) && this.isUsingValidOptions(hashedValue)
    }

    /**
     * Verify the hashed value's options.
     */
    protected isUsingValidOptions (hashedValue: string): boolean {
        const { options } = this.info(hashedValue)

        if (!options.memoryCost || !options.timeCost || !options.threads) {
            return false
        }

        return (
            options.memoryCost <= this.memory &&
            options.timeCost <= this.time &&
            options.threads <= this.threads
        )
    }

    /**
     * Verify the hashed value's algorithm.
     */
    protected isUsingCorrectAlgorithm (hashedValue: string): boolean {
        return this.info(hashedValue).algoName === 'argon2id'
    }

    /**
     * Extract Argon parameters from the hash.
     */
    protected parseInfo (hashedValue: string): Record<string, number | undefined> {
        // Example: $argon2id$v=19$m=65536,t=4,p=1$...
        const parts = hashedValue.split('$')
        const versionPart = parts[2] // v=19
        const paramsPart = parts[3] // m=65536,t=4,p=1

        const info: Record<string, number | undefined> = {}

        if (versionPart && versionPart.startsWith('v=')) {
            const version = parseInt(versionPart.split('=')[1], 10)
            if (!isNaN(version)) info.algo = version
        }

        if (paramsPart) {
            for (const param of paramsPart.split(',')) {
                const [key, value] = param.split('=')
                const val = parseInt(value, 10)
                switch (key) {
                    case 'm':
                        info.memoryCost = val
                        break
                    case 't':
                        info.timeCost = val
                        break
                    case 'p':
                        info.threads = val
                        break
                    default:
                        info[key] = val
                }
            }
        }

        return info
    }
}
