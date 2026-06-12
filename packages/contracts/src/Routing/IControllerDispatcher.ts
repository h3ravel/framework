import { ResourceMethod, RouteMethod } from '../Utilities/Utilities'
import { CONTAINER_TOKEN, createContainerToken } from '../Utilities/ContainerToken'

import { IController } from '../Core/IController'
import { IMiddleware } from './IMiddleware'
import { IRoute } from './IRoute'

export abstract class IControllerDispatcher {
    static readonly [CONTAINER_TOKEN] = createContainerToken('Routing.IControllerDispatcher')

    /**
     * Dispatch a request to a given controller and method.
     *
     * @param  route
     * @param  controller
     * @param  method
     */
    abstract dispatch (route: IRoute, controller: IController, method: ResourceMethod): Promise<any>;

    /**
     * Get the middleware for the controller instance.
     *
     * @param  controller
     * @param  method
     */
    abstract getMiddleware (controller: IController, method: RouteMethod): IMiddleware[];
}
