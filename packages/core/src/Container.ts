import type { Bindings, IContainer, UseKey } from '@h3ravel/shared'
import { Handler } from '@h3ravel/foundation'

type IBinding = UseKey | (new (..._args: any[]) => unknown)

export class Container implements IContainer {
    public bindings = new Map<IBinding, () => unknown>()
    public singletons = new Map<IBinding, unknown>()
    public exceptionHandler?: Handler
    private afterResolvingCallbacks = new Map<IBinding, ((resolved: any, app: this) => void)[]>()

    /**
     * Check if the target has any decorators
     * 
     * @param target 
     * @returns 
     */
    static hasAnyDecorator<C extends abstract new (...args: any[]) => any> (target: C): boolean
    static hasAnyDecorator<F extends (...args: any[]) => any> (target: F): boolean
    static hasAnyDecorator (target: (...args: any[]) => any): boolean {
        if (Reflect.getMetadataKeys(target).length > 0) return true

        const paramLength = target.length

        for (let i = 0; i < paramLength; i++) {
            if (Reflect.getMetadataKeys(target, `__param_${i}`).length > 0) {
                return true
            }
        }

        return false
    }

    /**
     * Bind a transient service to the container
     */
    bind<T> (key: new (...args: any[]) => T, factory: () => T): void
    bind<T extends UseKey> (key: T, factory: () => Bindings[T]): void
    bind<T extends UseKey> (
        key: T,
        factory: () => Bindings[T] | T
    ) {
        this.bindings.set(key, factory)
    }

    /**
     * Remove one or more transient services from the container
     */
    unbind<T extends UseKey> (key: T | T[]) {
        if (Array.isArray(key)) {
            for (let i = 0; i < key.length; i++) {
                this.bindings.delete(key[i])
                this.singletons.delete(key[i])
            }
        } else {
            this.bindings.delete(key)
            this.singletons.delete(key)
        }
    }

    /**
     * Bind a singleton service to the container
     */
    singleton<T extends UseKey> (
        key: T | (new (..._args: any[]) => Bindings[T]),
        factory: (app: this) => Bindings[T]
    ) {
        this.bindings.set(key, () => {
            if (!this.singletons.has(key)) {
                this.singletons.set(key, factory(this))
            }
            return this.singletons.get(key)!
        })
    }

    /**
     * Resolve a service from the container
     */
    make<T extends UseKey> (key: T): Bindings[T]
    make<C extends abstract new (...args: any[]) => any> (key: C): InstanceType<C>
    make<F extends (...args: any[]) => any> (key: F): ReturnType<F>
    make (key: any): any {
        /**
         * Direct factory binding
         */
        let resolved: any

        if (this.bindings.has(key)) {
            resolved = this.bindings.get(key)!()
        } else if (typeof key === 'function') {
            /**
             * If this is a class constructor, auto-resolve via reflection
             */
            resolved = this.build(key)
        } else {
            throw new Error(
                `No binding found for key: ${typeof key === 'string' ? key : (key as any)?.name}`
            )
        }

        this.runAfterResolvingCallbacks(key, resolved)
        return resolved
    }

    /**
     * Register a callback to be executed after a service is resolved
     */
    afterResolving<T extends UseKey> (
        key: T | (new (..._args: any[]) => Bindings[T]),
        callback: (resolved: Bindings[T], app: this) => void
    ) {
        const existing = this.afterResolvingCallbacks.get(key) || []

        existing.push(callback)
        this.afterResolvingCallbacks.set(key, existing)
    }

    /**
     * Execute all registered afterResolving callbacks for a given key
     */
    private runAfterResolvingCallbacks<T extends UseKey> (
        key: T,
        resolved: Bindings[T]
    ) {
        const callbacks = this.afterResolvingCallbacks.get(key) || []

        for (let i = 0; i < callbacks.length; i++) {
            callbacks[i](resolved, this)
        }
    }

    /**
     * Automatically build a class with constructor dependency injection
     */
    private build<T extends UseKey> (ClassType: new (..._args: any[]) => Bindings[T]): Bindings[T] {
        let dependencies: any[] = []

        if (Array.isArray((ClassType as any).__inject__)) {
            dependencies = (ClassType as any).__inject__.map((alias: any) => {
                return this.make(alias)
            })
        } else {
            const paramTypes: any[] = Reflect.getMetadata('design:paramtypes', ClassType) || []
            dependencies = paramTypes.map((dep) => this.make(dep))
        }

        return new ClassType(...dependencies)
    }

    /**
     * Check if a service is registered
     */
    has (key: UseKey): boolean {
        return this.bindings.has(key)
    }
}
