import type { IAbstractRouteCollection } from './IAbstractRouteCollection'
import { IRequest } from '../Http/IRequest'
import type { IRoute } from './IRoute'

export declare class IRouteCollection extends IAbstractRouteCollection {
    /**
     * Add a IRoute instance to the collection.
     */
    add (route: IRoute): IRoute;
    /**
     * Refresh the name look-up table.
     *
     * This is done in case any names are fluently defined or if routes are overwritten.
     */
    refreshNameLookups (): void;
    /**
     * Refresh the action look-up table.
     *
     * This is done in case any actions are overwritten with new controllers.
     */
    refreshActionLookups (): void;
    /**
     * Find the first route matching a given request.
     *
     * May throw framework-specific exceptions (MethodNotAllowed / NotFound).
     */
    match (request: IRequest): IRoute;
    /**
     * 
     * Get routes from the collection by method.
     * 
     * @param method 
     */
    public get (): IRoute[]
    public get (method: string): Record<string, IRoute>
    /**
     * Determine if the route collection contains a given named route.
     */
    hasNamedRoute (name: string): boolean;
    /**
     * Get a route instance by its name.
     */
    getByName (name: string): IRoute | undefined;
    /**
     * Get a route instance by its controller action.
     */
    getByAction (action: string): IRoute | undefined;
    /**
     * Get all of the routes in the collection.
     */
    getRoutes (): IRoute[];
    /**
     * Get all of the routes keyed by their HTTP verb / method.
     */
    getRoutesByMethod (): Record<string, Record<string, IRoute>>;
    /**
     * Get all of the routes keyed by their name.
     */
    getRoutesByName (): Record<string, IRoute>;
} 