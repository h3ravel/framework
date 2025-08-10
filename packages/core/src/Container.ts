import type { Bindings, IContainer, UseKey } from '@h3ravel/shared'

type IBinding = UseKey | (new (..._args: any[]) => unknown)

export class Container implements IContainer {
    private bindings = new Map<IBinding, () => unknown>()
    private singletons = new Map<IBinding, unknown>()

    /**
     * Check if the target has any decorators
     * 
     * @param target 
     * @returns 
     */
    static hasAnyDecorator (target: Function): boolean {
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
     * Bind a singleton service to the container
     */
    singleton<T extends UseKey> (
        key: T | (new (..._args: any[]) => Bindings[T]),
        factory: () => Bindings[T]
    ) {
        this.bindings.set(key, () => {
            if (!this.singletons.has(key)) {
                this.singletons.set(key, factory())
            }
            return this.singletons.get(key)!
        })
    }

    /**
     * Resolve a service from the container
     */
    make<T extends UseKey, X = undefined> (
        key: T | (new (..._args: any[]) => Bindings[T])
    ): X extends undefined ? Bindings[T] : X {
        /**
         * Direct factory binding
         */
        if (this.bindings.has(key)) {
            return this.bindings.get(key)!() as Bindings[T]
        }

        /**
         * If this is a class constructor, auto-resolve via reflection
         */
        if (typeof key === 'function') {
            return this.build(key)
        }

        throw new Error(
            `No binding found for key: ${typeof key === 'string' ? key : (key as any)?.name}`
        )
    }

    /**
     * Automatically build a class with constructor dependency injection
     */
    private build<T extends UseKey> (ClassType: new (..._args: any[]) => Bindings[T]): Bindings[T] {
        let dependencies: any[] = [];

        if (Array.isArray((ClassType as any).__inject__)) {
            dependencies = (ClassType as any).__inject__.map((alias: any) => {
                return this.make(alias)
            });
        } else {
            const paramTypes: any[] = Reflect.getMetadata('design:paramtypes', ClassType) || []
            dependencies = paramTypes.map((dep) => this.make(dep))
        }

        return new ClassType(...dependencies);
    }

    /**
     * Check if a service is registered
     */
    has (key: UseKey): boolean {
        return this.bindings.has(key)
    }
}
