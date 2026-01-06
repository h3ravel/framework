import { Arr, Macroable } from '@h3ravel/support'
import { Finalizable, use } from '@h3ravel/shared'
import { IController, MiddlewareIdentifier, MiddlewareList, ResourceMethod, ResourceOptions } from '@h3ravel/contracts'

import { CreatesRegularExpressionRouteConstraints } from './CreatesRegularExpressionRouteConstraints'
import { ResourceRegistrar } from './ResourceRegistrar'
import { RouteCollection } from './RouteCollection'
import { Router } from './Router'
import variadic from 'packages/support/src/Helpers'

export class PendingSingletonResourceRegistration extends use(
    Finalizable,
    CreatesRegularExpressionRouteConstraints,
    Macroable,
) {

    /**
     * The resource registrar.
     */
    protected registrar: ResourceRegistrar

    /**
     * The resource name.
     */
    protected name: string

    /**
     * The resource controller.
     */
    protected controller: typeof IController

    /**
     * The resource options.
     */
    protected options: ResourceOptions = {}

    /**
     * The resource's registration status.
     */
    protected registered = false

    /**
     * Create a new pending singleton resource registration instance.
     *
     * @param  registrar
     * @param  name
     * @param  controller
     * @param  options
     */
    constructor(registrar: ResourceRegistrar, name: string, controller: typeof IController, options: ResourceOptions) {
        super()
        this.name = name
        this.options = options
        this.registrar = registrar
        this.controller = controller
    }

    /**
     * Set the methods the controller should apply to.
     *
     * @param  methods
     */
    only (...methods: ResourceMethod[]): this {
        this.options.only = variadic(methods)

        return this
    }

    /**
     * Set the methods the controller should exclude.
     *
     * @param  methods
     */
    except (...methods: ResourceMethod[]): this {
        this.options.except = variadic(methods)

        return this
    }

    /**
     * Indicate that the resource should have creation and storage routes.
     *
     * @return  this
     */
    creatable () {
        this.options.creatable = true

        return this
    }

    /**
     * Indicate that the resource should have a deletion route.
     *
     * @return  this
     */
    destroyable () {
        this.options.destroyable = true

        return this
    }

    /**
     * Set the route names for controller actions.
     *
     * @param  names
     */
    names (names: Record<string, string>): this {
        this.options.names = names

        return this
    }

    /**
     * Set the route name for a controller action.
     *
     * @param  method
     * @param  name
     */
    setName (method: string, name: string): this {
        if (this.options.names) {
            this.options.names[method] = name
        } else {
            this.options.names = { [method]: name }
        }

        return this
    }

    /**
     * Override the route parameter names.
     *
     * @param  parameters
     */
    parameters (parameters: any): this {
        this.options.parameters = parameters

        return this
    }

    /**
     * Override a route parameter's name.
     *
     * @param  previous
     * @param  newValue
     */
    parameter (previous: string, newValue: any): this {
        this.options.parameters[previous] = newValue

        return this
    }

    /**
     * Add middleware to the resource routes.
     *
     * @param  middleware
     */
    middleware (middleware: MiddlewareList | MiddlewareIdentifier): this {
        const middlewares = Arr.wrap(middleware)

        for (let key = 0; key < middlewares.length; key++) {
            const value = middlewares[key]
            middlewares[key] = value
        }

        this.options.middleware = middlewares

        if (typeof this.options.middleware_for !== 'undefined') {
            for (const [method, value] of Object.entries(this.options.middleware_for ?? {})) {
                this.options.middleware_for[method] = Router.uniqueMiddleware([
                    ...Arr.wrap(value),
                    ...middlewares
                ])
            }
        }

        return this
    }

    /**
     * Specify middleware that should be added to the specified resource routes.
     *
     * @param  methods
     * @param  middleware
     */
    middlewareFor (methods: ResourceMethod[], middleware: MiddlewareList | MiddlewareIdentifier) {
        methods = Arr.wrap(methods)
        let middlewares = Arr.wrap(middleware)

        if (typeof this.options.middleware !== 'undefined') {
            middlewares = Router.uniqueMiddleware([
                ...(this.options.middleware ?? []),
                ...middlewares
            ])
        }

        for (const method of methods) {
            if (this.options.middleware_for) {
                this.options.middleware_for[method] = middlewares
            } else {
                this.options.middleware_for = { [method]: middlewares }
            }
        }

        return this
    }

    /**
     * Specify middleware that should be removed from the resource routes.
     *
     * @param  middleware
     */
    withoutMiddleware (middleware: MiddlewareList | MiddlewareIdentifier): this {
        this.options.excluded_middleware = [
            ...(this.options.excluded_middleware ?? []),
            ...Arr.wrap(middleware)
        ]

        return this
    }

    /**
     * Specify middleware that should be removed from the specified resource routes.
     *
     * @param  methods
     * @param  middleware
     */
    withoutMiddlewareFor (methods: ResourceMethod[], middleware: MiddlewareList | MiddlewareIdentifier): this {
        methods = Arr.wrap(methods)
        const middlewares = Arr.wrap(middleware)

        for (const method of methods) {
            if (this.options.excluded_middleware_for) {
                this.options.excluded_middleware_for[method] = middlewares
            } else {
                this.options.excluded_middleware_for = { [method]: middlewares }
            }
        }

        return this
    }

    /**
     * Add "where" constraints to the resource routes.
     *
     * @param  wheres
     */
    where (wheres: any): this {
        this.options.wheres = wheres

        return this
    }

    /**
     * Register the singleton resource route.
     */
    register (): RouteCollection | undefined {
        this.registered = true

        return this.registrar.singleton(
            this.name, this.controller, this.options
        )
    }

    $finalize (e?: this) {
        if (!this.registered) (e ?? this).register()
        return this ?? e
    }
}
