import type { IRoute } from './IRoute'
import type { RouteMethod } from '../Utilities/Utilities'

export declare abstract class IAbstractRouteCollection {
    static verbs: RouteMethod[]
    abstract get (): IRoute[];
    abstract get (method: string): Record<string, IRoute>;
    abstract getRoutes (): IRoute[];
    abstract count (): number
}