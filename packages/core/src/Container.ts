import 'reflect-metadata'
import { ExtractClassMethods, IContainer, type UseKey, ClassConstructor, type Bindings, CallableConstructor, IMiddleware, ConcreteConstructor } from '@h3ravel/contracts'
import { Handler, MiddlewareHandler } from '@h3ravel/foundation'
import { ContainerResolver } from './Manager/ContainerResolver'

type IBinding = UseKey | (new (...args: any[]) => unknown)

export class Container extends IContainer {
    public bindings = new Map<IBinding, () => unknown>()
    public singletons = new Map<IBinding, unknown>()
    public middlewareHandler?: MiddlewareHandler
    /**
     * All of the before resolving callbacks by class type.
     */
    private beforeResolvingCallbacks = new Map<IBinding, ((app: this) => void)[]>()
    /**
     * All of the after resolving callbacks by class type.
     */
    private afterResolvingCallbacks = new Map<IBinding, ((resolved: any, app: this) => void)[]>()
    /**
     * All of the registered rebound callbacks.
     */
    protected reboundCallbacks: Record<string, ((...args: any[]) => any)[]> = {}
    /**
     * The container's shared instances.
     */
    protected instances = new Map<string, new (...args: any[]) => any>()
    /**
     * The registered type alias.
     */
    protected aliases = new Map<string | ClassConstructor, any>()
    /**
     * The registered aliases keyed by the abstract name.
     */
    protected abstractAliases = new Map<string | ClassConstructor, any[]>()
    /**
     * The registered aliases keyed by the abstract name.
     */
    protected middlewares = new Map<string | IMiddleware, IMiddleware>()

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
     * 
     * @param key 
     * @param factory 
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
     * Bind unregistered middlewares to the service container so we can use them later
     * 
     * @param key 
     * @param middleware 
     */
    bindMiddleware (key: IMiddleware | string, middleware: ConcreteConstructor<IMiddleware>) {
        this.middlewares.set(key, middleware as never)
    }

    /**
     * Get all bound and unregistered middlewares in the service container
     * 
     * @param key 
     * @param middleware 
     */
    boundMiddlewares (): MapIterator<[string | IMiddleware, IMiddleware]>
    boundMiddlewares (key: IMiddleware | string): IMiddleware
    boundMiddlewares (key?: IMiddleware | string) {
        if (key) {
            return this.middlewares.get(key)
        }
        return this.middlewares.entries()
    }

    /**
     * Remove one or more transient services from the container
     * 
     * @param key 
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
     * 
     * @param key 
     * @param factory 
     */
    singleton<T extends UseKey> (key: T | (new (...args: any[]) => Bindings[T]), factory: (app: this) => Bindings[T]): void
    singleton<T extends UseKey> (key: T | (abstract new (...args: any[]) => Bindings[T]), factory: (app: this) => Bindings[T]): void
    singleton<T extends UseKey> (key: T | (new (...args: any[]) => Bindings[T]), factory: abstract new (...args: any[]) => any): void
    singleton<T extends UseKey> (key: T | (abstract new (...args: any[]) => Bindings[T]), factory: abstract new (...args: any[]) => any): void
    singleton<T extends UseKey> (
        key: T | (new (...args: any[]) => Bindings[T]),
        factory: any
    ): void {

        this.bindings.set(key, () => {
            if (!this.singletons.has(key)) {
                this.singletons.set(key, this.call(factory))
            }

            return this.singletons.get(key)
        })
    }

    /**
     * Read reflected param types, resolve dependencies from the container and 
     * optionally transform them, finally invoke the specified method on a class instance
     * 
     * @param instance 
     * @param method 
     * @param defaultArgs 
     * @param handler 
     * @returns 
     */
    async invoke<X extends InstanceType<ClassConstructor>, M extends ExtractClassMethods<X>> (
        instance: X,
        method: M,
        defaultArgs?: any[],
        handler?: CallableConstructor
    ): Promise<any> {
        /**
         * Get param types for the instance method
         */
        const paramTypes: any[] = Reflect.getMetadata('design:paramtypes', instance as never, method as string) || []

        /**
         * Resolve the bound dependencies
         */
        let args = await Promise.all(
            paramTypes.map(async (paramType: any) => {
                const inst = this.make(paramType)
                if (handler) {
                    return await handler(inst)
                }

                return inst
            })
        )

        /**
         * Ensure that the args is always filled
         */
        if (args.length < 1) {
            args = defaultArgs ?? []
        }

        const fn = instance[method]
        return Reflect.apply(fn as never, instance, args)
    }

    /**
     * Resolve the gevein service from the container
     * 
     * @param key 
     */
    make<T extends UseKey> (key: T): Bindings[T]
    make<C extends abstract new (...args: any[]) => any> (key: C): InstanceType<C>
    make<F extends (...args: any[]) => any> (key: F): ReturnType<F>
    make (key: any): any {
        return this.resolve(key)
    }

    /**
     * Resolve the gevein service from the container
     * 
     * @param abstract 
     * @param raiseEvents 
     */
    resolve (abstract: any, raiseEvents = true): any {
        abstract = this.getAlias(abstract)

        /**
         * Direct factory binding
         */
        let resolved: any

        if (raiseEvents)
            this.runBeforeResolvingCallbacks(abstract)

        if (this.bindings.has(abstract)) {
            resolved = this.bindings.get(abstract)!()
        } else if (this.instances.has(abstract)) {
            resolved = this.instances.get(abstract)
        } else if (typeof abstract === 'function') {
            /**
             * If this is a class constructor, auto-resolve via reflection
             */
            resolved = this.build(abstract)
        } else {
            throw new Error(
                `No binding found for key: ${typeof abstract === 'string' ? abstract : (abstract as any)?.name}`
            )
        }

        if (raiseEvents)
            this.runAfterResolvingCallbacks(abstract, resolved)

        return resolved
    }

    /**
     * Register a callback to be executed after a service is resolved
     * 
     * @param key 
     * @param callback 
     */
    afterResolving<T extends UseKey> (key: T, callback: (resolved: Bindings[T], app: this) => void): void
    afterResolving<T extends abstract new (...args: any[]) => any> (key: T, callback: (resolved: InstanceType<T>, app: this) => void): void
    afterResolving (key: any, callback: (resolved: any, app: this) => void) {
        const existing = this.afterResolvingCallbacks.get(key) || []
        existing.push(callback)
        this.afterResolvingCallbacks.set(key, existing)
    }

    /**
     * Register a new before resolving callback for all types.
     *
     * @param  key
     * @param  callback
     */
    beforeResolving<T extends UseKey> (key: T, callback: (app: this) => void): void
    beforeResolving<T extends abstract new (...args: any[]) => any> (key: T, callback: (app: this) => void): void
    beforeResolving (key: any, callback: (app: this) => void) {
        const existing = this.beforeResolvingCallbacks.get(key) || []
        existing.push(callback)
        this.beforeResolvingCallbacks.set(key, existing)
    }

    /**
     * Execute all registered beforeResolving callbacks for a given key
     *
     * @param  key
     * @param resolved 
     */
    private runBeforeResolvingCallbacks<T extends UseKey> (key: T) {
        const callbacks = this.beforeResolvingCallbacks.get(key) || []

        for (let i = 0; i < callbacks.length; i++) {
            callbacks[i](this)
        }
    }

    /**
     * Execute all registered afterResolving callbacks for a given key
     * 
     * @param key 
     * @param resolved 
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
     * 
     * @param ClassType 
     * @returns 
     */
    private build<T extends UseKey> (ClassType: new (...args: any[]) => Bindings[T]): Bindings[T] {
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
     * Determine if a given string is an alias.
     *
     * @param name
     */
    isAlias (name: string) {
        return this.aliases.has(name) && typeof this.aliases.get(name) !== 'undefined'
    }

    /**
     * Get the alias for an abstract if available.
     *
     * @param  abstract
     */
    getAlias (abstract: any): any {
        if (typeof abstract === 'string' && this.aliases.has(abstract)) {
            return this.getAlias(this.aliases.get(abstract))
        }

        return this.aliases.get(abstract) ?? abstract
    }

    /**
     * Set the alias for an abstract.
     * 
     * @param token 
     * @param target 
     */
    alias (key: [string | ClassConstructor, any][]): this
    alias (key: string | ClassConstructor, target: any): this
    alias (key: string | ClassConstructor | [string | ClassConstructor, any][], target?: any) {
        if (Array.isArray(key))
            for (const [tokn, targ] of key)
                this.aliases.set(tokn, targ)
        else
            this.aliases.set(key, target)

        return this
    }

    /**
     * Determine if the given abstract type has been bound.
     *
     * @param  string  $abstract
     * @returns
     */
    bound<T extends UseKey> (abstract: T): boolean
    bound<C extends abstract new (...args: any[]) => any> (abstract: C): boolean
    bound<F extends (...args: any[]) => any> (abstract: F): boolean
    bound (abstract: any): boolean {
        return this.bindings.has(abstract) || !!this.instances.get(abstract) || this.isAlias(abstract)
    }

    /**
     * Check if a service is registered
     * 
     * @param key 
     * @returns 
     */
    has<T extends UseKey> (key: T): boolean
    has<C extends abstract new (...args: any[]) => any> (key: C): boolean
    has<F extends (...args: any[]) => any> (key: F): boolean
    has (key: any): boolean {
        return this.bound(key)
    }

    /**
     * Register an existing instance as shared in the container.
     *
     * @param  abstract
     * @param  instance
     */
    instance<X = any> (key: string, instance: X): X
    instance<K extends abstract new (...args: any[]) => any, X = any> (abstract: K, instance: X): X
    instance (abstract: any, instance: any) {
        this.removeAbstractAlias(abstract)

        const isBound = this.bound(abstract)

        this.aliases.delete(abstract)

        // We'll check to determine if this type has been bound before, and if it has
        // we will fire the rebound callbacks registered with the container and it
        // can be updated with consuming classes that have gotten resolved here.
        this.instances.set(abstract, instance)

        if (isBound) {
            this.rebound(abstract)
        }

        return instance
    }

    /**
     * Call the given method and inject its dependencies.
     *
     * @param  callback
     */
    call<C extends abstract new (...args: any[]) => any> (callback: C): any | Promise<any>
    call<F extends (...args: any[]) => any> (callback: F): any | Promise<any>
    call (callback: (...args: any[]) => any): any | Promise<any> {
        if (ContainerResolver.isClass(callback)) {
            return this.make(callback)
        }
        return callback()
    }

    /**
     * Fire the "rebound" callbacks for the given abstract type.
     *
     * @param abstract
     */
    protected rebound (abstract: any) {
        const callbacks = this.getReboundCallbacks(abstract)
        if (!callbacks) {
            return
        }

        const instance = this.make(abstract as never)

        for (const callback of callbacks) {
            callback(this, instance)
        }
    }


    /**
     * Get the rebound callbacks for a given type.
     *
     * @param abstract
     */
    protected getReboundCallbacks (abstract: any) {
        return this.reboundCallbacks[abstract] ?? []
    }

    /**
     * Remove an alias from the contextual binding alias cache.
     *
     * @param  searched
     */
    protected removeAbstractAlias (searched: string) {
        if (!this.aliases.has(searched)) {
            return
        }

        for (const [abstract, aliases] of this.abstractAliases.entries()) {
            const filtered = aliases.filter(alias => alias !== searched)

            if (filtered.length > 0) {
                this.abstractAliases.set(abstract, filtered)
            } else {
                this.abstractAliases.delete(abstract)
            }
        }
    }
}
