import { Request } from '@h3ravel/http'
import { Route } from '../Route'

export class HostValidator {
    /**
     * Validate a given rule against a route and request.
     *
     * @param  route
     * @param  request
     */
    public matches (route: Route, request: Request) {
        const hostRegex = route.getCompiled()?.getHostRegex()

        if (!hostRegex) {
            return true
        }
        return hostRegex.test(request.getHost())
    }
}