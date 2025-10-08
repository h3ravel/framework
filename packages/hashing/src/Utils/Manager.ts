import { InvalidArgumentException, type SnakeToTitleCase, Str } from '@h3ravel/support'

import type { Configuration, HashAlgorithm } from '../Contracts/ManagerContract'
import { BcryptHasher } from '../Drivers/BcryptHasher'
import { ArgonHasher } from '../Drivers/ArgonHasher'
import { Argon2idHasher } from '../Drivers/Argon2idHasher'
import path from 'node:path'
import { existsSync } from 'node:fs'
import { ConfigException } from 'packages/core/dist'
import { FileSystem } from '@h3ravel/shared'

type CreateMethodName = `create${SnakeToTitleCase<HashAlgorithm>}Driver`

export abstract class Manager {
    constructor(public config = {} as Configuration) { }

    public abstract driver (): BcryptHasher | ArgonHasher | Argon2idHasher
    public createBcryptDriver?(): BcryptHasher
    public createArgonDriver?(): ArgonHasher
    public createArgon2idDriver?(): Argon2idHasher

    /**
     * Get the default driver name.
     *
     * @return string
     */
    public getDefaultDriver () {
        return this.config.driver ?? 'bcrypt'
    }

    protected createDriver (driver: HashAlgorithm) {
        const method = 'create' + Str.studly(driver) + 'Driver' as CreateMethodName

        if (typeof this[method] !== 'undefined') {
            return this[method]()
        }

        throw new InvalidArgumentException(`Driver [${driver}] not supported.`)
    }

    /**
     * Determine if a given string is already hashed.
     *
     * @param  value
     * @returns
     */
    public isHashed (value: string) {
        return this.driver().info(value).algo !== null
    }

    /**
     * Autoload config and initialize library
     *
     * @returns
     */
    public async init (basePath: string = process.cwd()): Promise<this> {
        const jsPath = path.resolve(basePath, 'hashing.config.js')
        const tsPath = path.resolve(basePath, 'hashing.config.ts')

        if (existsSync(jsPath)) {
            this.config = (await import(jsPath)).default
            return this
        }

        if (existsSync(tsPath)) {
            if (process.env.NODE_ENV !== 'production') {
                this.config = (await import(tsPath)).default
                return this
            } else {
                throw new ConfigException(
                    'hashing.config.ts found in production without build step',
                )
            }
        }

        return this
    }
}
