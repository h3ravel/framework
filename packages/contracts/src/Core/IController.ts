import { IApplication } from './IApplication'
import { IMiddleware } from '../Routing/IMiddleware'
import { ResourceMethod } from '../Utilities/Utilities'

/**
 * Defines the contract for all controllers.
 */
export abstract class IController {
    show?(...ctx: any[]): any
    edit?(...ctx: any[]): any
    index?(...ctx: any[]): any
    store?(...ctx: any[]): any
    create?(...ctx: any[]): any
    update?(...ctx: any[]): any
    destroy?(...ctx: any[]): any
    __invoke?(...ctx: any[]): any
    callAction?(method: ResourceMethod, parameters: any[]): any {
        void parameters
        void method
    }
    getMiddleware?(): IMiddleware {
        return {} as IMiddleware
    }
}