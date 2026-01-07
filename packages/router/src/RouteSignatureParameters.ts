import 'reflect-metadata'

import { IApplication, ResourceMethod, RouteActions } from '@h3ravel/contracts'
import { Str, isClass } from '@h3ravel/support'

import { Route } from './Route'
import { RouteActionConditions } from './Contracts/Utilities'
import { RouteParameter } from './RouteParameter'

export class RouteSignatureParameters {
    private static app: IApplication
    private static route: Route

    /**
     * set the current Application and Route instances
     * 
     * @param app 
     */
    static setRequirements (app: IApplication, route: Route) {
        this.app = app
        this.route = route

        return this
    }

    /**
     * Extract the route action's signature parameters.
     * 
     * @param action 
     * @param conditions 
     * @returns 
     */
    public static fromAction (action: RouteActions, conditions = {} as RouteActionConditions) {
        const uses = action.uses
        let target: any, methodName: string

        if (isClass(uses)) {
            target = this.app.make(uses)
            methodName = this.getControllerMethod(action)
        } else if (Array.isArray(uses)) {
            const [_target, _methodName] = uses
            target = target.prototype
            methodName = _methodName
        } else {
            // Logic for closures or single-function actions 
            return [new RouteParameter('context', this.app.getHttpContext()), new RouteParameter('app', this.app)]
        }

        // Get types emitted by @Injectable / @Decorator
        const types: any[] = Reflect.getMetadata('design:paramtypes', target, methodName) || []

        // Get names from the current Route object
        // Example: { user: 1, house: 5 } -> ['user', 'house']
        const routeParamNames = Object.keys(this.route.getParameters())
        let routeParamIndex = 0

        // Map Types to Parameters
        const parameters = types.map(type => {
            let name = 'unknown'

            // Determine if this type should "consume" one of the route parameter names.
            // We check if it matches the 'subClass' condition (e.g., UrlRoutable).
            const isBindingTarget = conditions.subClass && (type === conditions.subClass || type.prototype instanceof conditions.subClass)

            if (isBindingTarget) {
                name = routeParamNames[routeParamIndex++] || 'unnamed_binding'
            } else {
                // If it's a non-binding parameter (like Request/Response), we give it a placeholder.
                // In DI, the type is usually more important than the name.
                name = type.name?.toLowerCase() || 'injected'
            }

            return new RouteParameter(name, type)
        })

        // Return filtered list based on 'match' conditions
        if (conditions.subClass) {
            const subClass = conditions.subClass

            return parameters.filter(p => {
                const type = p.getType()
                return type === subClass || type.prototype instanceof subClass
            })
        }

        return parameters
    }

    /**
     * Get the controller method used for the route.
     * 
     * @param action 
     * @returns 
     */
    private static getControllerMethod (action: RouteActions): ResourceMethod {
        const holder = isClass(action.uses) && typeof action.controller === 'string' ? action.controller : 'index'
        return Str.parseCallback(holder).at(1) as ResourceMethod
    }
}