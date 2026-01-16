import { MiddlewareIdentifier, MiddlewareList } from '../Foundation/MiddlewareContract'

import { IRouteCollection } from './IRouteCollection'
import { ResourceMethod } from '../Utilities/Utilities'

export abstract class IPendingResourceRegistration {
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
     * Indicate that the resource routes should have "shallow" nesting.
     *
     * @param shallow
     */
    abstract shallow (shallow?: boolean): this;
    /**
     * Define the callable that should be invoked on a missing model exception.
     *
     * @param  callback
     */
    abstract missing (callback: string): this;
    /**
     * Indicate that the resource routes should be scoped using the given binding fields.
     *
     * @param  fields
     */
    abstract scoped (fields?: string[]): this;
    /**
     * Define which routes should allow "trashed" models to be retrieved when resolving implicit model bindings.
     *
     * @param  array  methods
     */
    abstract withTrashed (methods?: never[]): this;
    /**
     * Register the singleton resource route.
     */
    abstract register (): IRouteCollection | undefined;
}