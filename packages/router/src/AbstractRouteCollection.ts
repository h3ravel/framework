import type { IAbstractRouteCollection, RouteMethod } from '@h3ravel/contracts'

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
    abstract get (method?: string): Record<string, Route> | Route[]
    abstract getRoutes (): Route[]

    /* 
     * Match a request against a set of routes belonging to one HTTP verb.
     * 
     * @param routes 
     * @param req 
     * @returns 
     */
    protected matchAgainstRoutes (
        routes: Record<string, Route> | Route[],
        req: Request,
    ): Route | null {
        const path = req.path()
        const host = req.getHost()

        for (let route of (Array.isArray(routes) ? routes : Object.entries(routes))) {
            route = Array.isArray(route) ? route[1] : route

            /* 
             * Domain match check.
             */
            if (route.domain() && !this.matchDomain(route.domain(), host)) {
                continue
            }

            /* 
             * URI match check (simple or compiled).
             */
            if (!this.matchUri(route, path)) {
                continue
            }

            return route
        }

        return null
    }

    /* 
     * Final handler for a matched route. Responsible for:
     * - Throwing for not found
     * - Throwing for method not allowed
     * - Attaching params extracted from the match
     */
    protected handleMatchedRoute (req: Request, route?: Route | null): Route {
        if (route) {
            return route.bind(req)
        }

        throw new NotFoundHttpException(`The route ${req.path()} could not be found.`, undefined, 404)
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
}
