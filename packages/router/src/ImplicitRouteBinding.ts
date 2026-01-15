import { GenericObject, IApplication, IModel, UrlRoutable } from '@h3ravel/contracts'

import { ModelNotFoundException } from '@h3ravel/foundation'
import { Route } from './Route'
import { Str } from '@h3ravel/support'

export class ImplicitRouteBinding {
    /**
     * Resolve the implicit route bindings for the given route.
     * 
     * @param container 
     * @param route 
     */
    public static async resolveForRoute (container: IApplication, route: Route): Promise<void> {
        const parameters = route.getParameters()

        // Iterate only through parameters that are hinted as Models (UrlRoutable)
        for (const parameter of route.signatureParameters({ subClass: UrlRoutable as never })) {
            const parameterName = this.getParameterName(parameter.getName(), parameters)

            if (!parameterName) continue

            const parameterValue = parameters[parameterName]

            // If the parameter value is already a resolved object/model, skip it.
            if (parameterValue instanceof UrlRoutable) {
                continue
            }

            // Get the class constructor (e.g., User, Post)
            const instanceClass = parameter.getType()
            const instance = container.make(instanceClass)

            const parent = route.parentOfParameter(parameterName)

            // Determine if we should use Soft Delete logic
            const isSoftDeletable = typeof instanceClass.isSoftDeletable === 'function' && instanceClass.isSoftDeletable()
            const useSoftDelete = route.allowsTrashedBindings() && isSoftDeletable

            let model: IModel

            // Scoped Binding (e.g., /users/{user}/posts/{post})
            if (
                parent instanceof UrlRoutable &&
                !route.preventsScopedBindings() &&
                (route.enforcesScopedBindings() || parameterName in route.getBindingFields())
            ) {
                const childMethod = useSoftDelete
                    ? 'resolveSoftDeletableChildRouteBinding'
                    : 'resolveChildRouteBinding'

                model = await Reflect.apply(
                    (parent as any)[childMethod],
                    parent,
                    [parameterName, parameterValue, route.bindingFieldFor(parameterName)]
                )
            }

            // Standard Binding (e.g., /users/{user})
            else {
                const method = useSoftDelete
                    ? 'resolveSoftDeletableRouteBinding'
                    : 'resolveRouteBinding'

                model = await Reflect.apply(instance[method], instance, [parameterValue, route.bindingFieldFor(parameterName)])
            }

            if (!model) {
                throw new ModelNotFoundException().setModel(instanceClass, [parameterValue])
            }

            route.setParameter(parameterName, model)
        }
    }

    /**
     * Return the parameter name if it exists in the given parameters.
     * 
     * @param name 
     * @param parameters 
     * @returns 
     */
    protected static getParameterName (name: string, parameters: GenericObject): string | undefined {
        if (name in parameters) {
            return name
        }

        const snakedName = Str.snake(name)

        if (snakedName in parameters) {
            return snakedName
        }

        return undefined
    }
}