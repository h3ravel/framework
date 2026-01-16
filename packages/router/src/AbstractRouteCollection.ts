import type { IAbstractRouteCollection, RouteMethod } from '@h3ravel/contracts'

import { Collection } from '@h3ravel/support'
import { NotFoundHttpException } from '@h3ravel/foundation'
import { Request } from '@h3ravel/http'
import { Route } from './Route'

/* 
 * AbstractRouteCollection provides the shared route-matching logic
 * used by RouteCollection. It is responsible for scanning candidate
 * routes, matching domain/URI patterns, extracting parameters, and
 * resolving the matched route.
 */
export abstract class AbstractRouteCollection implements IAbstractRouteCollection {
    public static verbs: RouteMethod[] = ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']
    abstract get (): Route[]
    abstract get (method: string): Record<string, Route>
    abstract getRoutes (): Route[]

    /**
     * Match a request against a set of routes belonging to one HTTP verb.
     * 
     * @param routes 
     * @param req 
     * @param includingMethod 
     * @returns 
     */
    protected matchAgainstRoutes (
        routes: Record<string, Route>,
        req: Request,
        includingMethod = true
    ): Route | undefined {

        const [fallbacks, routeList] = (new Collection(routes)).partition(function (route) {
            return route.isFallback
        })

        return new Collection({ ...routeList.all(), ...fallbacks.all() }).first(
            (route) => route.matches(req, includingMethod)
        )
    }

    /**
     * Final handler for a matched route. Responsible for:
     * - Throwing for not found
     * - Throwing for method not allowed
     * - Attaching params extracted from the match
     * 
     * @param req 
     * @param route 
     * @returns 
     */
    protected handleMatchedRoute (req: Request, route?: Route | null): Route {
        if (route) {
            return route.bind(req)
        }

        throw new NotFoundHttpException(`The route "${req.path()}" was not found.`, undefined, 404)
    }

    /**
     * Determine if any routes match on another HTTP verb.
     *
     * @param  request
     */
    protected checkForAlternateVerbs (request: Request): string[] {
        // get all verbs except the current request method
        const methods = AbstractRouteCollection.verbs.filter(m => m !== request.getMethod())

        // check which verbs have matching routes
        const allowedMethods = methods.filter(method => {
            const routesForMethod = this.get(method)
            return this.matchAgainstRoutes(routesForMethod, request) != null
        })

        return allowedMethods
    }

    /* 
     * Determine if a domain matches (supports wildcard patterns).
     * Example:  "*.example.com"   matches  "api.example.com"
     */
    protected matchDomain (domain: string, host: string): boolean {
        if (!domain) return true
        if (domain === host) return true

        if (domain.includes('*')) {
            const pattern = domain.replace('*', '(.*)')
            const regex = new RegExp(`^${pattern}$`)
            return regex.test(host)
        }

        return false
    }

    /* 
     * Match URI path against the route's pattern or compiled regex.
     */
    protected matchUri (route: Route, path: string): boolean {
        /* 
         * Fallback simple literal match.
         */
        return path === route.uri()
    }

    /**
     * Count the number of items in the collection.
     */
    count (): number {
        return this.getRoutes().length
    }
}
