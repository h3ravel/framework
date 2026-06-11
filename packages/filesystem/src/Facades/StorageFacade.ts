import { Facades } from '@h3ravel/support/facades'
import { IStorage } from '@h3ravel/foundation'

class StorageFacade extends Facades {
    protected static getFacadeAccessor () {
        return 'storage'
    }
}

export const Storage = StorageFacade.createFacade<IStorage>()