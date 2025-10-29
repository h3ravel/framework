import 'reflect-metadata'

import { Application } from '..'

export class ContainerResolver {
    constructor(private app: Application) { }

    async resolveMethodParams<I extends Record<string, any>> (instance: I, method: keyof I, ..._default: any[]) {
        /**
         * Get param types for instance method
         */
        let params: any[] = Reflect.getMetadata('design:paramtypes', instance, String(method)) || []

        /**
         * Ensure that the Application class is always available
         */
        if (params.length < 1 && _default.length > 0) {
            params = _default
        }

        /**
         * Resolve the bound dependencies
         */
        const args: any[] = params.filter(e => ContainerResolver.isClass(e) || e instanceof Application).map((type: any) => {
            if (type instanceof Application) {
                return type
            }
            return this.app.make(type)
        })

        return new Promise<I>((resolve) => {
            resolve(instance[method](...args))
        })
    }

    static isClass (C: any) {
        return typeof C === 'function' &&
            C.prototype !== undefined &&
            Object.toString.call(C).substring(0, 5) === 'class'
    }
}
