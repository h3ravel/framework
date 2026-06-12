import { CallableConstructor } from '../Utilities/Utilities'
import { CONTAINER_TOKEN, createContainerToken } from '../Utilities/ContainerToken'
import { IRoute } from './IRoute'

export abstract class ICallableDispatcher {
    static readonly [CONTAINER_TOKEN] = createContainerToken('Routing.ICallableDispatcher')

    /**
     * Dispatch a request to a given callback.
     *
     * @param  route
     * @param  handler
     * @param  method
     */
    abstract dispatch (route: IRoute, handler: CallableConstructor): Promise<any>
}
