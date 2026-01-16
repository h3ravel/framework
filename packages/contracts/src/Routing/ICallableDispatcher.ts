import { CallableConstructor } from '../Utilities/Utilities'
import { IRoute } from './IRoute'

export abstract class ICallableDispatcher {
    /**
     * Dispatch a request to a given callback.
     *
     * @param  route
     * @param  handler
     * @param  method
     */
    abstract dispatch (route: IRoute, handler: CallableConstructor): Promise<any>
}