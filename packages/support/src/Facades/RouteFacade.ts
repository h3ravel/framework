import { IRouteRegistrar, IRouter } from '@h3ravel/contracts'

import { Facades } from './Facades'

class RouteFacade extends Facades {
    protected static getFacadeAccessor () {
        return 'router'
    }
}

export type FRoute =
    Omit<IRouter, 'group' | 'apiSingleton' | 'match' | 'resource' | 'apiResource' | 'singleton' | 'middleware'>

export const Route = RouteFacade.createFacade<IRouteRegistrar & FRoute>()