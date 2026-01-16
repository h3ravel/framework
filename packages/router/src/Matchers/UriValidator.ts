import { IRouteValidator } from '../Contracts/IRouteValidator'
import { Request } from '@h3ravel/http'
import { Route } from '../Route'
import { Str } from '@h3ravel/support'

export class UriValidator extends IRouteValidator {
    /**
     * Validate a given rule against a route and request.
     *
     * @param  route
     * @param  request
     */
    public matches (route: Route, request: Request) {
        const path = Str.of(request.getPathInfo()).ltrim('/').rtrim('/').toString() || '/'
        return route.getCompiled()!.getRegex().test(decodeURIComponent(path))
    }
}