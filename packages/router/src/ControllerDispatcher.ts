import { ControllerMethod, IController, IControllerDispatcher, RouteMethod } from '@h3ravel/contracts'

import { Application } from '@h3ravel/core'
import { Collection } from '@h3ravel/support'
import { FiltersControllerMiddleware } from './TraitLike/FiltersControllerMiddleware'
import { Route } from './Route'
import { RouteDependencyResolver } from './TraitLike/RouteDependencyResolver'

export class ControllerDispatcher extends IControllerDispatcher {
    resolver: RouteDependencyResolver

    /**
     * 
     * @param container The container instance.
     */
    public constructor(protected container: Application) {
        super()
        this.resolver = new RouteDependencyResolver(container)
    }

    /**
     * Dispatch a request to a given controller and method.
     *
     * @param  route
     * @param  controller
     * @param  method
     */
    public async dispatch (route: Route, controller: Required<IController>, method: ControllerMethod) {
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
    protected async resolveParameters (route: Route, controller: IController, method: ControllerMethod) {
        return this.resolver.resolveClassMethodDependencies(
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

        return (new Collection(controller.getMiddleware()))
            .reject((data) => FiltersControllerMiddleware.methodExcludedByOptions(method, data.options))
            .pluck('middleware')
            .all()
    }
}
