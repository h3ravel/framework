import 'reflect-metadata'

import { IController, ResourceMethod } from '@h3ravel/contracts'

import { Application } from '@h3ravel/core'
import { RuntimeException } from '@h3ravel/support'

export class RouteDependencyResolver {
    constructor(protected container: Application) { }

    /**
     * Resolve the object method's type-hinted dependencies.
     *
     * @param  parameters
     * @param  instance
     * @param  method
     */
    public async resolveClassMethodDependencies (parameters: Record<string, any>, instance: IController, method: ResourceMethod) {
        /**
         * Ensure the method exists on the controller
         */
        if (typeof instance[method] !== 'function') {
            throw new RuntimeException(`[${method}] not found on controller [${instance.constructor.name}]`)
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
                const instance = Object.values(parameters).find(e => e instanceof paramType)

                if (instance && typeof instance === 'object') {
                    return instance
                }

                return await this.container.make(paramType)
            })
        )

        /**
         * Ensure that the HttpContext and Application instances are always available
         */
        if (args.length < 1) {
            args = [this.container.getHttpContext(), this.container]
        }

        /**
         * Call the controller method, passing all resolved dependencies
         */
        return this.resolveMethodDependencies([...args, ...Object.values(parameters)])
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
