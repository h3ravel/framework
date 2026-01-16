import { Facades } from './Facades'
import { IRequest } from '@h3ravel/contracts'

class RequestFacade extends Facades {
    protected static getFacadeAccessor () {
        return 'http.request'
    }
}

export const Request = RequestFacade.createFacade<IRequest>()