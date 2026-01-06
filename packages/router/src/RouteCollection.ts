import type { IRouteCollection, RouteActions } from '@h3ravel/contracts'

import { AbstractRouteCollection } from './AbstractRouteCollection'
import { Request } from '@h3ravel/http'
import { Route } from './Route'

export class RouteCollection extends AbstractRouteCollection implements IRouteCollection {
    /**
     * An array of the routes keyed by method.
     */
    protected routes: Record<string, Record<string, Route>> = {}

    /**
     * A flattened array of all of the routes.
     */
    protected allRoutes: Record<string, Route> = {}

    /**
     * A look-up table of routes by their names.
     */
    protected nameList: Record<string, Route> = {}

    /**
     * A look-up table of routes by controller action.
     */
    protected actionList: Record<string, Route> = {}

    /**
     * Add a Route instance to the collection.
     */
    public add (route: Route): Route {
        this.addToCollections(route)

        this.addLookups(route)

        return route
    }

    /**
     * Add the given route to the arrays of routes.
     */
    protected addToCollections (route: Route): void {
        const domainAndUri = `${route.getDomain()}${route.uri()}`
        for (const method of route.methods) {
            if (!this.routes[method]) {
                this.routes[method] = {}
            }
            this.routes[method][domainAndUri] = route
        }

        this.allRoutes[route.methods.join('|') + domainAndUri] = route
    }

    /**
     * Add the route to any look-up tables if necessary.
     */
    protected addLookups (route: Route): void {
        // Name lookup
        const name = route.getName()
        if (name && !this.inNameLookup(name)) {
            this.nameList[name] = route
        }

        // Controller action lookup
        const action = route.getAction()

        const controller = action.controller ?? undefined

        if (controller && !this.inActionLookup(controller)) {
            this.addToActionList(action, route)
        }
    }

    /**
     * Add a route to the controller action dictionary.
     */
    protected addToActionList (action: RouteActions, route: Route): void {
        const key = (typeof action.controller === 'string' ? action.controller : action.controller?.constructor.name) ?? ''

        if (key) {
            this.actionList[key] = route
        }
    }

    /**
     * Determine if the given controller is in the action lookup table.
     */
    protected inActionLookup (controller: string): boolean {
        return Object.prototype.hasOwnProperty.call(this.actionList, controller)
    }

    /**
     * Determine if the given name is in the name lookup table.
     */
    protected inNameLookup (name: string): boolean {
        return Object.prototype.hasOwnProperty.call(this.nameList, name)
    }

    /**
     * Refresh the name look-up table.
     *
     * This is done in case any names are fluently defined or if routes are overwritten.
     */
    public refreshNameLookups (): void {
        this.nameList = {}

        for (const key of Object.keys(this.allRoutes)) {
            const route = this.allRoutes[key]
            const name = route.getName()
            if (name && !this.inNameLookup(name)) {
                this.nameList[name] = route
            }
        }
    }

    /**
     * Refresh the action look-up table.
     *
     * This is done in case any actions are overwritten with new controllers.
     */
    public refreshActionLookups (): void {
        this.actionList = {}

        for (const key of Object.keys(this.allRoutes)) {
            const route = this.allRoutes[key]
            const controller = route.getAction().controller ?? undefined
            if (controller && !this.inActionLookup(controller)) {
                this.addToActionList(route.getAction(), route)
            }
        }
    }

    /**
     * Find the first route matching a given request.
     *
     * May throw framework-specific exceptions (MethodNotAllowed / NotFound).
     */
    public match (request: Request): Route {
        const routes = this.get(request.getMethod())

        const route = this.matchAgainstRoutes(routes, request)

        return this.handleMatchedRoute(request, route)
    }

    /**
     * Get routes from the collection by method.
     */
    public get (): Route[]
    public get (method: string): Record<string, Route>
    public get (method?: string): Record<string, Route> | Route[] {
        if (typeof method === 'undefined' || method === undefined) {
            return this.getRoutes()
        }

        return this.routes[method] ?? {}
    }

    /**
     * Determine if the route collection contains a given named route.
     */
    public hasNamedRoute (name: string): boolean {
        return this.getByName(name) !== undefined
    }

    /**
     * Get a route instance by its name.
     */
    public getByName (name: string): Route | undefined {
        return this.nameList[name] ?? undefined
    }

    /**
     * Get a route instance by its controller action.
     */
    public getByAction (action: string): Route | undefined {
        return this.actionList[action] ?? undefined
    }

    /**
     * Get all of the routes in the collection.
     */
    public getRoutes (): Route[] {
        return Object.values(this.allRoutes)
    }

    /**
     * Get all of the routes keyed by their HTTP verb / method.
     */
    public getRoutesByMethod (): Record<string, Record<string, Route>> {
        return this.routes
    }

    /**
     * Get all of the routes keyed by their name.
     */
    public getRoutesByName (): Record<string, Route> {
        return this.nameList
    }
}