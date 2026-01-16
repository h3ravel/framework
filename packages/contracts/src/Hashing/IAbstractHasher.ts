import { HashInfo } from './IHashManagerContract'

export abstract class IAbstractHasher {
    /**
     * Get information about the given hashed value.
     *
     * @param  hashedValue
     * @returns
     */
    abstract info (hashedValue: string): HashInfo
}
