import { HashAlgorithm } from './IHashManagerContract'
import { IArgon2idHasher } from './IArgon2idHasher'
import { IArgonHasher } from './IArgonHasher'
import { IBcryptHasher } from './IBcryptHasher'

export abstract class IBaseHashManager {
    abstract driver (): IBcryptHasher | IArgonHasher | IArgon2idHasher;

    abstract createBcryptDriver?(): IBcryptHasher;

    abstract createArgonDriver?(): IArgonHasher;

    abstract createArgon2idDriver?(): IArgon2idHasher;

    /**
     * Get the default driver name.
     *
     * @return string
     */
    abstract getDefaultDriver (): HashAlgorithm;

    protected abstract createDriver (driver: HashAlgorithm): IArgonHasher | IArgon2idHasher | IBcryptHasher;

    /**
     * Determine if a given string is already hashed.
     *
     * @param  value
     * @returns
     */
    abstract isHashed (value: string): boolean;

    /**
     * Autoload config and initialize library
     *
     * @returns
     */
    abstract init (basePath?: string): Promise<this>;
}