import { Arr, Macroable } from '@h3ravel/support'
import { CallableConstructor, IController, ResourceOptions, RouteActions, RouteMethod } from '@h3ravel/contracts'
import { UseMagic, trait, use } from '@h3ravel/shared'

import { CreatesRegularExpressionRouteConstraints } from './CreatesRegularExpressionRouteConstraints'
import { FRoute } from '@h3ravel/support/facades'
import { Injectable } from '@h3ravel/core'
import { Router } from './Router'

const Inference = trait(e => class extends e { } as {
    new(): FRoute
})

@Injectable()
export class RouteRegistrar extends use(
    Inference,
    CreatesRegularExpressionRouteConstraints,
    Macroable,
    UseMagic,
) {
    protected router: Router
    protected attributes: RouteActions = {}

    protected passthru = [
        'get', 'post', 'put', 'patch', 'delete', 'options', 'any',
    ]

    protected allowedAttributes: (keyof RouteActions)[] = [
        'as',
        'can',
        'controller',
        'domain',
        'middleware',
        'missing',
        'name',
        'namespace',
        'prefix',
        'scopeBindings',
        'where',
        'withoutMiddleware',
        'withoutScopedBindings',
    ]

    protected aliases: Record<keyof RouteActions, string> = {
        name: 'as',
        scopeBindings: 'scope_bindings',
        withoutScopedBindings: 'scope_bindings',
        withoutMiddleware: 'excluded_middleware',
    }

    constructor(router: Router) {
        super()
        this.router = router
        void this.group
    }

    attribute (key: string, value: any) {
        if (!this.allowedAttributes.includes(key)) {
            throw new Error(`Attribute [${key}] does not exist.`)
        }
        if (key === 'middleware') {
            // TODO: Not all middleware will be stringifiable so we may need to remove .map(String) to accomodate callables.
            value = Arr.wrap(value).filter(Boolean).map(String)
        }

        const attributeKey = this.aliases[key] ?? key

        if (key === 'withoutMiddleware') {
            value = [
                ...(this.attributes[attributeKey] ?? []),
                ...Arr.wrap(value),
            ]
        }

        if (key === 'withoutScopedBindings') {
            value = false
        }

        this.attributes[attributeKey] = value

        return this
    }

    resource<C extends typeof IController> (name: string, controller: C, options: ResourceOptions = {}) {
        return this.router.resource(name, controller, {
            ...this.attributes,
            ...options,
        })
    }

    apiResource<C extends typeof IController> (name: string, controller: C, options: ResourceOptions = {}) {
        return this.router.apiResource(name, controller, {
            ...this.attributes,
            ...options,
        })
    }

    singleton<C extends typeof IController> (name: string, controller: C, options: ResourceOptions = {}) {
        return this.router.singleton(name, controller, {
            ...this.attributes,
            ...options,
        })
    }

    apiSingleton<C extends typeof IController> (name: string, controller: C, options: ResourceOptions = {}) {
        return this.router.apiSingleton(name, controller, {
            ...this.attributes,
            ...options,
        })
    }

    group (callback: CallableConstructor | any[] | string) {
        this.router.group(this.attributes, callback)
        return this
    }

    match (methods: RouteMethod | RouteMethod[], uri: string, action?: RouteActions) {
        return this.router.match(methods, uri, this.compileAction(action))
    }

    protected registerRoute (method: Lowercase<RouteMethod>, uri: string, action?: RouteActions) {
        if (!Array.isArray(action)) {
            action = {
                ...this.attributes,
                ...(action ? { uses: action } : {}),
            }
        }

        return this.router[method](uri, this.compileAction(action))
    }

    protected compileAction (action?: RouteActions): ResourceOptions {
        if (action == null) {
            return this.attributes
        }

        if (typeof action === 'string' || typeof action === 'function') {
            action = { uses: action }
        }

        if (Array.isArray(action) && action.length === 2 && typeof action[0] === 'string') {
            const controller = action[0].startsWith('\\') ? action[0] : `\\${action[0]}`
            action = {
                uses: `${controller}@${action[1]}`,
                controller: `${controller}@${action[1]}`,
            }
        }

        return { ...this.attributes, ...action }
    }

    /**
     * PHP __call equivalent
     * Handled via Proxy in Magic
     */
    __call (method: string, parameters: any[]) {
        if ((this.constructor as any).hasMacro?.(method)) {
            return (this as any).macroCall(method, parameters)
        }

        if (this.passthru.includes(method)) {
            return Reflect.apply(this.registerRoute, this, [method, ...parameters])
        }

        if (this.allowedAttributes.includes(method)) {
            if (method === 'middleware') {
                return this.attribute(method, Array.isArray(parameters[0]) ? parameters[0] : parameters)
            }

            if (method === 'can') {
                return this.attribute(method, [parameters])
            }

            return this.attribute(method, parameters.length ? parameters[0] : true)
        }

        throw new Error(`Method ${this.constructor.name}::${method} does not exist.`)
    }
}
