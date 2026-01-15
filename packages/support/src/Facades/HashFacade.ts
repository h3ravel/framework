import { Facades } from './Facades'
import { IHashManager } from '@h3ravel/contracts'

class HashFacade extends Facades {
    protected static getFacadeAccessor () {
        return 'hash'
    }
}

export const Hash = HashFacade.createFacade<IHashManager>()