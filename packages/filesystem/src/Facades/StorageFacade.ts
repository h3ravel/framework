import { Facades } from '@h3ravel/support/facades'
import { IFilesystemManager } from '@h3ravel/foundation'

class StorageFacade extends Facades {
    protected static getFacadeAccessor () {
        return 'storage'
    }
}

export const Storage = StorageFacade.createFacade<IFilesystemManager>()