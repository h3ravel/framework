import { ResourceMethod, RouteMethod } from '../Utilities/Utilities'

import { IController } from '../Core/IController'
import { IMiddleware } from './IMiddleware'
import { IRoute } from './IRoute'

export abstract class IControllerDispatcher {
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