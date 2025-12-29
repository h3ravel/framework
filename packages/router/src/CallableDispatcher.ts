import { CallableConstructor, ICallableDispatcher } from '@h3ravel/contracts'

import { Application } from '@h3ravel/core'
import { Route } from './Route'
import { RouteDependencyResolver } from './TraitLike/RouteDependencyResolver'

export class CallableDispatcher extends ICallableDispatcher {
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
        return this.resolver.resolveMethodDependencies(
            route.parametersWithoutNulls()
        )
    }
}
