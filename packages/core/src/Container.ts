import type { Bindings, UseKey } from './Contracts/BindingsContract'

type IBinding = UseKey | (new (..._args: any[]) => unknown)

export class Container {
    private bindings = new Map<IBinding, () => unknown>()
    private singletons = new Map<IBinding, unknown>()

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
    make<T extends UseKey> (key: T | (new (..._args: any[]) => Bindings[T])): Bindings[T] {
        // 1️⃣ Direct factory binding
        if (this.bindings.has(key)) {
            return this.bindings.get(key)!() as Bindings[T]
        }

        // 2️⃣ If class constructor → auto-resolve via reflection
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
        const paramTypes: any[] = Reflect.getMetadata('design:paramtypes', ClassType) || []
        const dependencies = paramTypes.map((dep) => this.make(dep))
        return new ClassType(...dependencies)
    }


    /**
     * Check if a service is registered
     */
    has (key: UseKey): boolean {
        return this.bindings.has(key)
    }
}
