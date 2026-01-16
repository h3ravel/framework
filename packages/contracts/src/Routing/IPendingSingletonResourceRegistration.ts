import { MiddlewareIdentifier, MiddlewareList } from '../Foundation/MiddlewareContract'

import { IAbstractRouteCollection } from './IAbstractRouteCollection'
import { ResourceMethod } from '../Utilities/Utilities'

export abstract class IPendingSingletonResourceRegistration {
    /**
     * Set the methods the controller should apply to.
     *
     * @param  methods
     */
    abstract only (...methods: ResourceMethod[]): this;
    /**
     * Set the methods the controller should exclude.
     *
     * @param  methods
     */
    abstract except (...methods: ResourceMethod[]): this;
    /**
     * Indicate that the resource should have creation and storage routes.
     *
     * @return  this
     */
    abstract creatable (): this;
    /**
     * Indicate that the resource should have a deletion route.
     *
     * @return  this
     */
    abstract destroyable (): this;
    /**
     * Set the route names for controller actions.
     *
     * @param  names
     */
    abstract names (names: Record<string, string>): this;
    /**
     * Set the route name for a controller action.
     *
     * @param  method
     * @param  name
     */
    abstract setName (method: string, name: string): this;
    /**
     * Override the route parameter names.
     *
     * @param  parameters
     */
    abstract parameters (parameters: any): this;
    /**
     * Override a route parameter's name.
     *
     * @param  previous
     * @param  newValue
     */
    abstract parameter (previous: string, newValue: any): this;
    /**
     * Add middleware to the resource routes.
     *
     * @param  middleware
     */
    abstract middleware (middleware: MiddlewareList | MiddlewareIdentifier): this;
    /**
     * Specify middleware that should be added to the specified resource routes.
     *
     * @param  methods
     * @param  middleware
     */
    abstract middlewareFor (methods: ResourceMethod[], middleware: MiddlewareList | MiddlewareIdentifier): this;
    /**
     * Specify middleware that should be removed from the resource routes.
     *
     * @param  middleware
     */
    abstract withoutMiddleware (middleware: MiddlewareList | MiddlewareIdentifier): this;
    /**
     * Specify middleware that should be removed from the specified resource routes.
     *
     * @param  methods
     * @param  middleware
     */
    abstract withoutMiddlewareFor (methods: ResourceMethod[], middleware: MiddlewareList | MiddlewareIdentifier): this;
    /**
     * Add "where" constraints to the resource routes.
     *
     * @param  wheres
     */
    abstract where (wheres: any): this;
    /**
     * Register the singleton resource route.
     */
    abstract register (): IAbstractRouteCollection | undefined;
}