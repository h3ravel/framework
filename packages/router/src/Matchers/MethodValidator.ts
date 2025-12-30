import { IRouteValidator } from '../Contracts/IRouteValidator'
import { Request } from '@h3ravel/http'
import { Route } from '../Route'

export class MethodValidator extends IRouteValidator {
    /**
     * Validate a given rule against a route and request.
     *
     * @param  route
     * @param  request
     */
    public matches (route: Route, request: Request) {
        return route.methods.includes(request.getMethod() as never)
    }
}