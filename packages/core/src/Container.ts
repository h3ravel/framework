type Binding = string | (new (..._args: any[]) => unknown)

export class Container {
    private bindings = new Map<Binding, () => unknown>()
    private singletons = new Map<Binding, unknown>()


    /**
     * Bind a transient service to the container
     */
    bind<T> (
        key: string | (new (..._args: any[]) => T),
        factory: () => T
    ) {
        this.bindings.set(key, factory)
    }

    /**
     * Bind a singleton service to the container
     */
    singleton<T> (
        key: string | (new (..._args: any[]) => T),
        factory: () => T
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
    make<T> (key: string | (new (..._args: any[]) => T)): T {
        // 1️⃣ Direct factory binding
        if (this.bindings.has(key)) {
            return this.bindings.get(key)!() as T
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
    private build<T> (ClassType: new (..._args: any[]) => T): T {
        const paramTypes: any[] = Reflect.getMetadata('design:paramtypes', ClassType) || []
        const dependencies = paramTypes.map((dep) => this.make(dep))
        return new ClassType(...dependencies)
    }


    /**
     * Check if a service is registered
     */
    has (key: string): boolean {
        return this.bindings.has(key)
    }
}
