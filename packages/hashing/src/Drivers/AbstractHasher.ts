import { Info } from '../Contracts/ManagerContract'
import { ParseInfo } from '../Utils/ParseInfo'

export abstract class AbstractHasher {
    /**
     * Get information about the given hashed value.
     *
     * @param  hashedValue
     * @returns
     */
    public info (hashedValue: string): Info {
        let algoName = 'unknown' as Info['algoName']

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
