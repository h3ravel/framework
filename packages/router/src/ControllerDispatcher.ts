import { IApplication, IController, IControllerDispatcher, IMiddleware, ResourceMethod, RouteMethod } from '@h3ravel/contracts'

import { Collection } from '@h3ravel/support'
import { FiltersControllerMiddleware } from './Traits/FiltersControllerMiddleware'
import { Route } from './Route'
import { RouteDependencyResolver } from './Traits/RouteDependencyResolver'
import { mix } from '@h3ravel/shared'

export class ControllerDispatcher extends mix(
    IControllerDispatcher,
    RouteDependencyResolver,
    FiltersControllerMiddleware
) {
    /**
     * 
     * @param container The container instance.
     */
    public constructor(protected container: IApplication) {
        super(container)
    }

    /**
     * Dispatch a request to a given controller and method.
     *
     * @param  route
     * @param  controller
     * @param  method
     */
    public async dispatch (route: Route, controller: Required<IController>, method: ResourceMethod) {
        const parameters = await this.resolveParameters(route, controller, method)

        if (Object.prototype.hasOwnProperty.call(controller, 'callAction')) {
            return controller.callAction(method, Object.values(parameters))
        }

        return await controller[method].apply(controller, [...Object.values(parameters)])
    }

    /**
     * Resolve the parameters for the controller.
     *
     * @param  route
     * @param  controller
     * @param  method
     */
    protected async resolveParameters (route: Route, controller: IController, method: ResourceMethod) {
        return this.resolveClassMethodDependencies(
            route.parametersWithoutNulls(), controller, method
        )
    }

    /**
     * Get the middleware for the controller instance.
     *
     * @param  controller
     * @param  method
     */
    public getMiddleware (controller: IController, method: RouteMethod) {
        if (!Object.prototype.hasOwnProperty.call(controller, 'getMiddleware')) {
            return []
        }

        return (new Collection(controller.getMiddleware?.() ?? {} as IMiddleware))
            .reject((data) => ControllerDispatcher.methodExcludedByOptions(method, data.options))
            .pluck('middleware')
            .all() as never
    }
}
