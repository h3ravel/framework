import { IRouteValidator } from '../Contracts/IRouteValidator'
import { Request } from '@h3ravel/http'
import { Route } from '../Route'

export class SchemeValidator extends IRouteValidator {
    /**
     * Validate a given rule against a route and request.
     *
     * @param  route
     * @param  request
     */
    public matches (route: Route, request: Request) {
        if (route.httpOnly()) {
            return !request.secure()
        } else if (route.secure()) {
            return request.secure()
        }

        return true
    }
}