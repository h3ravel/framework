import { HashInfo, IAbstractHasher } from '@h3ravel/contracts'

import { ParseInfo } from '../Utils/ParseInfo'

export class AbstractHasher extends IAbstractHasher {
    /**
     * Get information about the given hashed value.
     *
     * @param  hashedValue
     * @returns
     */
    public info (hashedValue: string): HashInfo {
        let algoName = 'unknown' as HashInfo['algoName']

        if (hashedValue.startsWith('$2')) algoName = 'bcrypt'
        if (hashedValue.startsWith('$argon2id$')) algoName = 'argon2id'
        if (hashedValue.startsWith('$argon2i$')) algoName = 'argon'

        const options = ParseInfo.getInfo(hashedValue, algoName)
        const algo: number = options.algo!
        delete options.algo

        return {
            algo,
            algoName,
            options,
        }
    }
}
