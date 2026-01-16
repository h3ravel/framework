import { IRequest, IRoute } from '@h3ravel/contracts'

export abstract class IRouteValidator {
    abstract matches (route: IRoute, request: IRequest): boolean | undefined
}