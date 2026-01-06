import { CallableConstructor, GenericObject, IController, ResourceMethod, ResourceOptions, RouteActions } from '@h3ravel/contracts'
import { Route, RouteCollection, Router } from '.'

import { Str } from '@h3ravel/support'

export class ResourceRegistrar {
    /**
     * The router instance.
     */
    protected router: Router

    /**
     * The default actions for a resourceful controller.
     */
    protected resourceDefaults: ResourceMethod[] = ['index', 'create', 'store', 'show', 'edit', 'update', 'destroy']

    /**
     * The default actions for a singleton resource controller.
     */
    protected singletonResourceDefaults: ResourceMethod[] = ['show', 'edit', 'update']

    /**
     * The parameters set for this resource instance.
     */
    protected parameters?: string | GenericObject<string>

    /**
     * The global parameter mapping.
     */
    protected static parameterMap: GenericObject = {}

    /**
     * Singular global parameters.
     */
    protected static _singularParameters = true

    /**
     * The verbs used in the resource URIs.
     */
    protected static _verbs = {
        create: 'create',
        edit: 'edit',
    }

    /**
     * Create a new resource registrar instance.
     *
     * @param  router
     */
    constructor(router: Router) {
        this.router = router
    }

    /**
     * Route a resource to a controller.
     *
     * @param  name
     * @param  controller
     * @param  options
     */
    register<C extends typeof IController> (name: string, controller: C, options: ResourceOptions = {}): RouteCollection | undefined {
        if (typeof options.parameters !== 'undefined' && this.parameters == null) {
            this.parameters = options.parameters
        }

        // If the resource name contains a slash, we will assume the developer wishes to
        // register these resource routes with a prefix so we will set that up out of
        // the box so they don't have to mess with it. Otherwise, we will continue.
        if (name.includes('/')) {
            this.prefixedResource(name, controller, options)

            return
        }

        // We need to extract the base resource from the resource name. Nested resources
        // are supported in the framework, but we need to know what name to use for a
        // place-holder on the route parameters, which should be the base resources.
        const base = this.getResourceWildcard(name.split('+').at(-1)!)

        const defaults = this.resourceDefaults

        const collection = new RouteCollection

        const resourceMethods = this.getResourceMethods(defaults, options)

        for (const m of resourceMethods) {
            const optionsForMethod = options

            if (typeof optionsForMethod.middleware_for?.[m] !== 'undefined') {
                optionsForMethod.middleware = optionsForMethod.middleware_for?.[m]
            }

            if (typeof optionsForMethod.excluded_middleware_for?.[m] !== 'undefined') {
                optionsForMethod.excluded_middleware = Router.uniqueMiddleware([
                    ...(optionsForMethod.excluded_middleware ?? []),
                    ...optionsForMethod.excluded_middleware_for[m]
                ])
            }

            const route = (this['addResource' + Str.ucfirst(m) as never] as CallableConstructor)(
                name, base, controller, optionsForMethod
            )

            if (typeof options.bindingFields !== 'undefined') {
                this.setResourceBindingFields(route, options.bindingFields)
            }

            const allowed = options.trashed != null ? options.trashed : resourceMethods.filter(m => ['show', 'edit', 'update'].includes(m))

            if (typeof options.trashed !== 'undefined' && allowed.includes(m)) {
                route.withTrashed()
            }

            collection.add(route)
        }

        return collection
    }

    /**
     * Route a singleton resource to a controller.
     *
     * @param  name
     * @param  controller
     * @param  options 
     */
    singleton<C extends typeof IController> (name: string, controller: C, options: ResourceOptions = {}) {
        if (typeof options.parameters !== 'undefined' && this.parameters == null) {
            this.parameters = options.parameters
        }

        // If the resource name contains a slash, we will assume the developer wishes to
        // register these singleton routes with a prefix so we will set that up out of
        // the box so they don't have to mess with it. Otherwise, we will continue.
        if (name.includes('/')) {
            this.prefixedSingleton(name, controller, options)

            return
        }

        let defaults = this.singletonResourceDefaults

        if (typeof options.creatable !== 'undefined') {
            defaults = defaults.concat(['create', 'store', 'destroy'])
        } else if (typeof options.destroyable !== 'undefined') {
            defaults = defaults.concat(['destroy'])
        }

        const collection = new RouteCollection()

        const resourceMethods = this.getResourceMethods(defaults, options)

        for (const m of resourceMethods) {
            const optionsForMethod = options

            if (typeof optionsForMethod.middleware_for?.[m] !== 'undefined') {
                optionsForMethod.middleware = optionsForMethod.middleware_for[m]
            }

            if (typeof optionsForMethod.excluded_middleware_for?.[m] !== 'undefined') {
                optionsForMethod.excluded_middleware = Router.uniqueMiddleware([
                    ...(optionsForMethod.excluded_middleware ?? []),
                    ...optionsForMethod.excluded_middleware_for[m]
                ])
            }

            const route = (this['addSingleton' + Str.ucfirst(m) as never] as CallableConstructor)(
                name, controller, optionsForMethod
            )

            if (typeof options.bindingFields !== 'undefined') {
                this.setResourceBindingFields(route, options.bindingFields)
            }

            collection.add(route)
        }

        return collection
    }

    /**
     * Build a set of prefixed resource routes.
     *
     * @param  name
     * @param  controller
     * @param  options
     */
    protected prefixedResource<C extends typeof IController> (name: string, controller: C, options: ResourceOptions): Router {
        let prefix: string
        [name, prefix] = this.getResourcePrefix(name)

        // We need to extract the base resource from the resource name. Nested resources
        // are supported in the framework, but we need to know what name to use for a
        // place-holder on the route parameters, which should be the base resources.
        const callback = (me: Router) => {
            me.resource(name, controller, options)
        }

        return this.router.group({ prefix }, callback)
    }

    /**
     * Build a set of prefixed singleton routes.
     *
     * @param  name
     * @param  controller
     * @param  options
     */
    protected prefixedSingleton<C extends typeof IController> (name: string, controller: C, options: ResourceOptions): Router {
        let prefix: string
        [name, prefix] = this.getResourcePrefix(name)

        // We need to extract the base resource from the resource name. Nested resources
        // are supported in the framework, but we need to know what name to use for a
        // place-holder on the route parameters, which should be the base resources.
        const callback = function (me: Router) {
            me.singleton(name, controller, options)
        }

        return this.router.group({ prefix }, callback)
    }

    /**
     * Extract the resource and prefix from a resource name.
     *
     * @param  name
     * 
     */
    protected getResourcePrefix (name: string) {
        const segments = name.split('/')

        // To get the prefix, we will take all of the name segments and implode them on
        // a slash. This will generate a proper URI prefix for us. Then we take this
        // last segment, which will be considered the final resources name we use.
        const prefix = segments.slice(0, -1).join('/')

        return [segments.at(-1)!, prefix]
    }

    /**
     * Get the applicable resource methods.
     *
     * @param  defaults
     * @param  options
     * 
     */
    protected getResourceMethods (defaults: ResourceMethod[], options: ResourceOptions) {
        let methods = defaults

        if (typeof options.only !== 'undefined') {
            methods = methods.filter(m => new Set(options.only).has(m))
        }

        if (typeof options.except !== 'undefined') {
            methods = methods.filter(m => !new Set(options.except).has(m))
        }

        return methods
    }

    /**
     * Add the index method for a resourceful route.
     *
     * @param  name
     * @param  base
     * @param  controller
     * @param  options 
     */
    protected addResourceIndex<C extends typeof IController> (name: string, _base: string, controller: C, options: ResourceOptions): Route {
        const uri = this.getResourceUri(name)

        delete options.missing

        const action = this.getResourceAction(name, controller, 'index', options)

        return this.router.get(uri, action)
    }

    /**
     * Add the create method for a resourceful route.
     *
     * @param  name
     * @param  base
     * @param  controller
     * @param  options
     */
    protected addResourceCreate<C extends typeof IController> (name: string, base: string, controller: C, options: ResourceOptions): Route {
        const uri = this.getResourceUri(name) + '/' + ResourceRegistrar._verbs['create']

        delete options.missing

        const action = this.getResourceAction(name, controller, 'create', options)

        return this.router.get(uri, action)
    }

    /**
     * Add the store method for a resourceful route.
     *
     * @param  name
     * @param  base
     * @param  controller
     * @param  options
     */
    protected addResourceStore<C extends typeof IController> (name: string, base: string, controller: C, options: ResourceOptions): Route {
        const uri = this.getResourceUri(name)

        delete options.missing

        const action = this.getResourceAction(name, controller, 'store', options)

        return this.router.post(uri, action)
    }

    /**
     * Add the show method for a resourceful route.
     *
     * @param  name
     * @param  base
     * @param  controller
     * @param  options
     */
    protected addResourceShow<C extends typeof IController> (name: string, base: string, controller: C, options: ResourceOptions): Route {
        name = this.getShallowName(name, options)!

        const uri = this.getResourceUri(name) + '/{' + base + '}'

        const action = this.getResourceAction(name, controller, 'show', options)

        return this.router.get(uri, action)
    }

    /**
     * Add the edit method for a resourceful route.
     *
     * @param  name
     * @param  base
     * @param  controller
     * @param  options 
     */
    protected addResourceEdit<C extends typeof IController> (name: string, base: string, controller: C, options: ResourceOptions): Route {
        name = this.getShallowName(name, options)!

        const uri = this.getResourceUri(name) + '/{' + base + '}/' + ResourceRegistrar._verbs['edit']

        const action = this.getResourceAction(name, controller, 'edit', options)

        return this.router.get(uri, action)
    }

    /**
     * Add the update method for a resourceful route.
     *
     * @param  name
     * @param  base
     * @param  controller
     * @param  options
     */
    protected addResourceUpdate<C extends typeof IController> (name: string, base: string, controller: C, options: ResourceOptions): Route {
        name = this.getShallowName(name, options)!

        const uri = this.getResourceUri(name) + '/{' + base + '}'

        const action = this.getResourceAction(name, controller, 'update', options)

        return this.router.match(['PUT', 'PATCH'], uri, action)
    }

    /**
     * Add the destroy method for a resourceful route.
     *
     * @param  name
     * @param  base
     * @param  controller
     * @param  options
     */
    protected addResourceDestroy<C extends typeof IController> (name: string, base: string, controller: C, options: ResourceOptions): Route {
        name = this.getShallowName(name, options)!

        const uri = this.getResourceUri(name) + '/{' + base + '}'

        const action = this.getResourceAction(name, controller, 'destroy', options)

        return this.router.delete(uri, action)
    }

    /**
     * Add the create method for a singleton route.
     *
     * @param  name
     * @param  controller
     * @param  options 
     */
    protected addSingletonCreate<C extends typeof IController> (name: string, controller: C, options: ResourceOptions): Route {
        const uri = this.getResourceUri(name) + '/' + ResourceRegistrar._verbs['create']

        delete options.missing

        const action = this.getResourceAction(name, controller, 'create', options)

        return this.router.get(uri, action)
    }

    /**
     * Add the store method for a singleton route.
     *
     * @param  name
     * @param  controller
     * @param  options 
     */
    protected addSingletonStore<C extends typeof IController> (name: string, controller: C, options: ResourceOptions): Route {
        const uri = this.getResourceUri(name)

        delete options.missing

        const action = this.getResourceAction(name, controller, 'store', options)

        return this.router.post(uri, action)
    }

    /**
     * Add the show method for a singleton route.
     *
     * @param  name
     * @param  controller
     * @param  options 
     */
    protected addSingletonShow<C extends typeof IController> (name: string, controller: C, options: ResourceOptions): Route {
        const uri = this.getResourceUri(name)

        delete options.missing

        const action = this.getResourceAction(name, controller, 'show', options)

        return this.router.get(uri, action)
    }

    /**
     * Add the edit method for a singleton route.
     *
     * @param  name
     * @param  controller
     * @param  options 
     */
    protected addSingletonEdit<C extends typeof IController> (name: string, controller: C, options: ResourceOptions): Route {
        name = this.getShallowName(name, options)!

        const uri = this.getResourceUri(name) + '/' + ResourceRegistrar._verbs['edit']

        const action = this.getResourceAction(name, controller, 'edit', options)

        return this.router.get(uri, action)
    }

    /**
     * Add the update method for a singleton route.
     *
     * @param  name
     * @param  controller
     * @param  options 
     */
    protected addSingletonUpdate<C extends typeof IController> (name: string, controller: C, options: ResourceOptions): Route {
        name = this.getShallowName(name, options)!

        const uri = this.getResourceUri(name)

        const action = this.getResourceAction(name, controller, 'update', options)

        return this.router.match(['PUT', 'PATCH'], uri, action)
    }

    /**
     * Add the destroy method for a singleton route.
     *
     * @param  name
     * @param  controller
     * @param  options 
     */
    protected addSingletonDestroy<C extends typeof IController> (name: string, controller: C, options: ResourceOptions): Route {
        name = this.getShallowName(name, options)!

        const uri = this.getResourceUri(name)

        const action = this.getResourceAction(name, controller, 'destroy', options)

        return this.router.delete(uri, action)
    }

    /**
     * Get the name for a given resource with shallowness applied when applicable.
     *
     * @param  name
     * @param  options
     * 
     */
    protected getShallowName (name: string, options: ResourceOptions) {
        return typeof options.shallow !== 'undefined' && options.shallow
            ? name.split('+').at(-1)!
            : name
    }

    /**
     * Set the route's binding fields if the resource is scoped.
     *
     * @param  \Illuminate\Routing\Route  route
     * @param  bindingFields
     * 
     */
    protected setResourceBindingFields (route: Route, bindingFields: Record<string, any>) {
        const matches = [...route.uri().matchAll(/(?<={).*?(?=})/g)]
        const fields = Object.fromEntries(matches.map(m => [m[0], null]))

        const intersected = Object.fromEntries(
            Object.keys(fields)
                .filter(k => k in bindingFields)
                .map(k => [k, bindingFields[k]])
        )

        route.setBindingFields({ ...fields, ...intersected })
    }

    /**
     * Get the base resource URI for a given resource.
     *
     * @param  resource
     * 
     */
    getResourceUri (resource: string) {
        if (!resource.includes('+')) {
            return resource
        }

        // Once we have built the base URI, we'll remove the parameter holder for this
        // base resource name so that the individual route adders can suffix these
        // paths however they need to, as some do not have any parameters at all.
        const segments = resource.split('+')

        const uri = this.getNestedResourceUri(segments)

        return uri.replaceAll('/{' + this.getResourceWildcard(segments.at(-1)!) + '}', '')
    }

    /**
     * Get the URI for a nested resource segment array.
     *
     * @param  segments
     */
    protected getNestedResourceUri (segments: string[]): string {
        // We will spin through the segments and create a place-holder for each of the
        // resource segments, as well as the resource itself. Then we should get an
        // entire string for the resource URI that contains all nested resources.
        return segments.map((s) => {
            return s + '/{' + this.getResourceWildcard(s) + '}'
        }).join('/')
    }

    /**
     * Format a resource parameter for usage.
     *
     * @param  value
     */
    getResourceWildcard (value: string) {
        if (typeof this.parameters === 'object' && typeof this.parameters?.[value] !== 'undefined') {
            value = this.parameters[value]
        } else if (typeof ResourceRegistrar.parameterMap[value] !== 'undefined') {
            value = ResourceRegistrar.parameterMap[value]
        } else if (this.parameters === 'singular' || ResourceRegistrar._singularParameters) {
            value = Str.singular(value)
        }

        return value.replaceAll('-', '_')
    }

    /**
     * Get the action array for a resource route.
     *
     * @param  resource
     * @param  controller
     * @param  method
     * @param  options
     * 
     */
    protected getResourceAction<C extends typeof IController> (resource: string, controller: C, method: string, options: ResourceOptions) {
        const name = this.getResourceRouteName(resource, method, options)

        const action: RouteActions = {
            'as': name,
            'uses': controller,
            'controller': controller.constructor.name + '@' + method,
        }

        if (typeof options.middleware !== 'undefined') {
            action.middleware = options.middleware
        }

        if (typeof options.excluded_middleware !== 'undefined') {
            action.excluded_middleware = options.excluded_middleware
        }

        if (typeof options.wheres !== 'undefined') {
            action.where = options.wheres
        }

        if (typeof options.missing !== 'undefined') {
            action.missing = options.missing
        }

        return action
    }

    /**
     * Get the name for a given resource.
     *
     * @param  resource
     * @param  method
     * @param  options
     * 
     */
    protected getResourceRouteName (resource: string, method: string, options: ResourceOptions) {
        let name = resource

        // If the names array has been provided to us we will check for an entry in the
        // array first. We will also check for the specific method within this array
        // so the names may be specified on a more "granular" level using methods.
        if (typeof options.names !== 'undefined') {
            if (typeof options.names === 'string') {
                name = options.names
            } else if (typeof options.names[method] !== 'undefined') {
                return options.names[method]
            }
        }

        // If a global prefix has been assigned to all names for this resource, we will
        // grab that so we can prepend it onto the name when we create this name for
        // the resource action. Otherwise we'll just use an empty string for here.
        const prefix = typeof options.as !== 'undefined' ? options.as + '+' : ''

        return `${prefix}${name}.${method}`.replace(/^\++|\++$/g, '')
    }

    /**
     * Set or unset the unmapped global parameters to singular.
     *
     * @param  singular
     */
    static singularParameters (singular = true) {
        this._singularParameters = singular
    }

    /**
     * Get the global parameter map.
     */
    static getParameters () {
        return this.parameterMap
    }

    /**
     * Set the global parameter mapping.
     *
     * @param  $parameters
     * 
     */
    static setParameters (parameters = []) {
        this.parameterMap = parameters
    }

    /**
     * Get or set the action verbs used in the resource URIs.
     *
     * @param  verbs
     * 
     */
    static verbs (verbs: GenericObject = {}) {
        if (Object.entries(verbs).length < 1) {
            return ResourceRegistrar._verbs
        }

        ResourceRegistrar._verbs = { ...ResourceRegistrar._verbs, ...verbs }
    }
}
