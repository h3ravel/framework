import { ControllerMethod } from '../Utilities/Utilities'
import { IMiddleware } from '../Routing/IMiddleware'

/**
 * Defines the contract for all controllers.
 */
export abstract class IController {
    show?(...ctx: any[]): any
    index?(...ctx: any[]): any
    store?(...ctx: any[]): any
    update?(...ctx: any[]): any
    destroy?(...ctx: any[]): any
    __invoke?(...ctx: any[]): any
    callAction (method: ControllerMethod, parameters: any[]): any {
        void parameters
        void method
    }
    getMiddleware (): IMiddleware {
        return {} as IMiddleware
    }
}