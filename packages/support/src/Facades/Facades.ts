import { ClassConstructor, ConcreteConstructor, IApplication, IBinding } from '@h3ravel/contracts'

import { RuntimeException } from '../Exceptions/RuntimeException'
import { isInternal } from '@h3ravel/shared'

export abstract class Facades {
    /**
     * The application instance being facaded.
     */
    protected static app?: IApplication

    /**
     * The resolved object instances.
     */
    protected static resolvedInstance = new Map<string | IBinding, any>()

    /**
     * Indicates if the resolved instance should be cached.
     */
    protected static cached = true

    /**
     * Called once during bootstrap
     * 
     * @param app 
     */
    static setApplication (app: IApplication) {
        this.app = app
    }

    /**
     * Get the application instance behind the facade.
     */
    static getApplication () {
        return this.app
    }

    /**
     * Get the registered name of the component.
     * Each facade must define its container key
     *
     * @return string
     *
     * @throws {RuntimeException}
     */
    protected static getFacadeAccessor (): string {
        throw new RuntimeException('Facade accessor not implemented.')
    }

    /**
     * Get the root object behind the facade.
     */
    static getFacadeRoot<T> () {
        return this.resolveInstance<T>(this.getFacadeAccessor())
    }

    /**
     * Resolve the facade root instance from the container.
     *
     * @param  name
     */
    static resolveInstance<T> (name: string | IBinding) {
        if (this.resolvedInstance.has(name)) {
            return this.resolvedInstance.get(name)
        }

        if (this.app) {
            const instance = this.app.make<ConcreteConstructor<ClassConstructor<T>>>(name as never)

            if (this.cached) {
                this.resolvedInstance.set(name, instance as never)
            }

            return instance
        }
    }

    /**
     * Clear a resolved facade instance.
     *
     * @param  name
     */
    static clearResolvedInstance (name: string | IBinding) {
        this.resolvedInstance.delete(name)
    }

    /**
     * Clear all of the resolved instances.
     */
    static clearResolvedInstances () {
        this.resolvedInstance.clear()
    }

    /**
     * Hotswap the underlying instance behind the facade.
     *
     * @param  instance
     */
    static swap (instance: ConcreteConstructor<ClassConstructor>) {
        this.resolvedInstance.set(this.getFacadeAccessor(), instance)

        if (this.app) {
            this.app.instance(this.getFacadeAccessor(), instance)
        }
    }

    static __callStatic<T> (method: string, args: any[]) {
        const instance = this.getFacadeRoot<T>()
        if (!instance) throw new Error('Facade root not resolved.')

        // If method is not internal, call it directly
        if (typeof instance[method] === 'function' && !isInternal(instance, method)) {
            return Reflect.apply(instance[method as never], instance, args)
        }

        // Otherwise, forward to __call
        if (typeof (instance as any).__call === 'function') {
            return (instance as any).__call(method, args)
        }

        // Fallback if method does not exist at all
        throw new Error(
            `Method [${method}] does not exist on [${instance.constructor.name}] facade root.`
        )
    }

    static createFacade<T extends object> () {
        return new Proxy(
            {},
            {
                get: (_target, prop: string) => {
                    return (...args: any[]) =>
                        this.__callStatic(prop, args)
                }
            }
        ) as T
    }
}
