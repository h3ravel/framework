import { Obj } from '@h3ravel/support'
import { Request } from '@h3ravel/http'
import { Route } from './Route'

export class RouteParameterBinder {
    /**
     * Create a new Route parameter binder instance.
     *
     * @param  route The route instance.
     */
    public constructor(protected route: Route) {
    }

    /**
     * Get the parameters for the route.
     *
     * @param request
     */
    public parameters (request: Request) {
        let parameters = this.bindPathParameters(request)

        // If the route has a regular expression for the host part of the URI, we will
        // compile that and get the parameter matches for this domain. We will then
        // merge them into this parameters array so that this array is completed.
        if (this.route.compiled?.getHostRegex()) {
            parameters = this.bindHostParameters(
                request, parameters
            )
        }

        return this.replaceDefaults(parameters)
    }

    /**
     * Get the parameter matches for the path portion of the URI.
     *
     * @param  request
     */
    protected bindPathParameters (request: Request): Record<string, string> {
        // ensure path starts with '/'
        const path = request.decodedPath().replace(/^\/+/, '')

        const pathRegex = this.route.compiled?.getRegex() ?? ''
        const matches = path.match(pathRegex) ?? []

        // slice off full match and map to keys
        return this.matchToKeys(matches.slice(1))
    }

    /**
     * Extract the parameter list from the host part of the request.
     *
     * @param  request
     * @param parameters
     */
    protected bindHostParameters (request: Request, parameters: Record<string, any>): Record<string, string> {
        const host = request.getHost()
        const hostRegex = this.route.compiled?.getHostRegex() ?? ''
        const matches = host.match(hostRegex) ?? []

        // slice off the full match (index 0) and map to keys
        const bound = this.matchToKeys(matches.slice(1))

        // merge with existing parameters
        return { ...bound, ...parameters }
    }

    /**
     * Combine a set of parameter matches with the route's keys.
     *
     * @param   matches
     */
    protected matchToKeys (matches: string[]): Record<string, string> {
        const parameterNames = this.route.parameterNames()

        if (!parameterNames || parameterNames.length === 0) {
            return {}
        }

        const parameters: Record<string, string> = {}

        // map names to values in order
        for (let i = 0; i < parameterNames.length; i++) {
            const name = parameterNames[i]
            const value = matches[i]
            if (typeof value === 'string' && value.length > 0) {
                parameters[name] = value
            }
        }

        return parameters
    }

    /**
     * Replace null parameters with their defaults.
     *
     * @param parameters
     * @return array
     */
    protected replaceDefaults (parameters: Record<string, any>) {
        for (const [key, value] of Object.entries(parameters)) {
            parameters[key] = value ?? Obj.get(this.route._defaults, key)
        }

        for (const [key, value] of Object.entries(this.route._defaults)) {
            if (!parameters[key]) {
                parameters[key] = value
            }
        }

        return parameters
    }
}