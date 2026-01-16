import { RouteMethod } from '../Utilities/Utilities'

/**
 * Defines the contract for all middlewares.
 * Any middleware implementing this must define these methods.
 */
export abstract class IMiddleware {
    options: { only?: RouteMethod[], except?: RouteMethod[] } = {}
    abstract handle (...args: any[]): Promise<any>
} 