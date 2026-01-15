import { CallableConstructor, IApplication, ICallableDispatcher } from '@h3ravel/contracts'

import { Route } from './Route'
import { RouteDependencyResolver } from './Traits/RouteDependencyResolver'
import { mix } from '@h3ravel/shared'

export class CallableDispatcher extends mix(ICallableDispatcher, RouteDependencyResolver) {

    /**
     * 
     * @param container The container instance.
     */
    public constructor(protected container: IApplication) {
        super(container)
    }

    /**
     * Dispatch a request to a given callback.
     *
     * @param  route
     * @param  handler
     * @param  method
     */
    public async dispatch (route: Route, handler: CallableConstructor) {
        return handler(this.container.make('http.context'), ...Object.values(this.resolveParameters(route)))
    }

    /**
     * Resolve the parameters for the callable.
     *
     * @param  route
     * @param  handler
     */
    protected resolveParameters (route: Route) {
        return this.resolveMethodDependencies(
            route.parametersWithoutNulls()
        )
    }
}
