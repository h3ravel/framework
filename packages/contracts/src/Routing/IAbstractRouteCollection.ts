import type { IRoute } from './IRoute'
import type { RouteMethod } from '../Utilities/Utilities'

export declare abstract class IAbstractRouteCollection {
    static verbs: RouteMethod[]
    abstract get (method?: string): Record<string, IRoute> | IRoute[];
    abstract getRoutes (): IRoute[];
}