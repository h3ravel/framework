import { Facades } from './Facades'
import { IUrlGenerator } from '@h3ravel/contracts'

class URLFacade extends Facades {
    protected static getFacadeAccessor () {
        return 'url'
    }
}

export const URL = URLFacade.createFacade<IUrlGenerator>()