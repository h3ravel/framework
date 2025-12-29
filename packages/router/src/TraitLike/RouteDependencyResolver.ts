import 'reflect-metadata'

import { ControllerMethod, IController } from '@h3ravel/contracts'

import { Application } from '@h3ravel/core'
import { LogicException } from '@h3ravel/foundation'

export class RouteDependencyResolver {
    constructor(protected container: Application) { }

    /**
     * Resolve the object method's type-hinted dependencies.
     *
     * @param  parameters
     * @param  instance
     * @param  method
     */
    public async resolveClassMethodDependencies (parameters: Record<string, any>, instance: IController, method: ControllerMethod) {
        if (!Object.prototype.hasOwnProperty.call(instance, method)) {
            return parameters
        }

        /**
         * Ensure the method exists on the controller
         */
        if (typeof instance[method] !== 'function') {
            throw new LogicException(`Method "${method}" not found on controller ${instance.constructor.name}`)
        }

        /**
         * Get param types for the controller method
         */
        const paramTypes: [] = Reflect.getMetadata('design:paramtypes', instance, method) || []

        /**
         * Resolve the bound dependencies
         */
        let args = await Promise.all(
            paramTypes.map(async (paramType: any) => {
                const inst = this.container.make(paramType)
                // if (inst instanceof Model) {
                // Route model binding returns a Promise
                // return await Helpers.resolveRouteModelBinding(path ?? '', ctx, inst)
                return inst
            })
        )

        /**
         * Ensure that the HttpContext is always available
         */
        if (args.length < 1) {
            args = [this.container.make('http.context')]
        }

        /**
         * Call the controller method, passing all resolved dependencies
         */
        return this.resolveMethodDependencies([...args, ...parameters])
    }

    /**
     * Resolve the given method's type-hinted dependencies.
     *
     * @param  parameters
     */
    public resolveMethodDependencies (parameters: Record<string, any>) {
        /**
         * Call the route callback handler
         */
        return parameters
    }
}
