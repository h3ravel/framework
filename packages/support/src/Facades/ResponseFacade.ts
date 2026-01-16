import { Facades } from './Facades'
import { IResponse } from '@h3ravel/contracts'

class ResponseFacade extends Facades {
    protected static getFacadeAccessor () {
        return 'http.response'
    }
}

export const Response = ResponseFacade.createFacade<IResponse>()