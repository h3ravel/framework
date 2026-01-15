import type { Bindings, IBinding, UseKey } from '../Utilities/BindingsContract'
import type { IMiddlewareHandler } from '../Routing/IMiddlewareHandler'
import { ClassConstructor, CallableConstructor, ExtractClassMethods, ConcreteConstructor } from '../Utilities/Utilities'
import { IMiddleware } from '../Routing/IMiddleware'

/**
 * Interface for the Container contract, defining methods for dependency injection and service resolution.
 */
export abstract class IContainer {
    abstract middlewareHandler?: IMiddlewareHandler

    /**
     * Check if the target has any decorators
     *
     * @param target
     * @returns
     */
    static hasAnyDecorator<C extends abstract new (...args: any[]) => any> (target: C): boolean
    static hasAnyDecorator<F extends (...args: any[]) => any> (target: F): boolean {
        void target
        return false
    };

    /**
     * Bind a transient service to the container
     *
     * @param key
     * @param factory
     */
    abstract bind<T> (key: new (...args: any[]) => T, factory: () => T): void;
    abstract bind<T extends UseKey> (key: T, factory: () => Bindings[T]): void;

    /**
     * Bind unregistered middlewares to the service container so we can use them later
     * 
     * @param key 
     * @param middleware 
     */
    abstract bindMiddleware (key: IMiddleware | string, middleware: ConcreteConstructor<IMiddleware>): void

    /**
     * Get all bound and unregistered middlewares in the service container
     * 
     * @param key 
     * @param middleware 
     */
    abstract boundMiddlewares (): MapIterator<[string | IMiddleware, IMiddleware]>
    abstract boundMiddlewares (key: IMiddleware | string): IMiddleware

    /**
     * Remove one or more transient services from the container
     *
     * @param key
     */
    abstract unbind<T extends UseKey> (key: T | T[]): void;

    /**
     * Bind a singleton service to the container
     *
     * @param key
     * @param factory
     */
    abstract singleton<T extends UseKey> (key: T | (new (...args: any[]) => Bindings[T]), factory: (app: this) => Bindings[T]): void
    abstract singleton<T extends UseKey> (key: T | (abstract new (...args: any[]) => Bindings[T]), factory: (app: this) => Bindings[T]): void
    abstract singleton<T extends UseKey> (key: T | (new (...args: any[]) => Bindings[T]), factory: abstract new (...args: any[]) => any): void
    abstract singleton<T extends UseKey> (key: T | (abstract new (...args: any[]) => Bindings[T]), factory: abstract new (...args: any[]) => any): void

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
    abstract invoke<X extends InstanceType<ClassConstructor>, M extends ExtractClassMethods<X>> (
        instance: X,
        method: M,
        defaultArgs?: any[],
        handler?: CallableConstructor
    ): Promise<any>

    /**
     * Resolve a service from the container
     *
     * @param key
     */
    abstract make<T extends UseKey> (key: T): Bindings[T];
    abstract make<C extends abstract new (...args: any[]) => any> (key: C): InstanceType<C>;
    abstract make<F extends (...args: any[]) => any> (key: F): ReturnType<F>;

    /**
     * Register a callback to be executed after a service is resolved
     *
     * @param key
     * @param callback
     */
    abstract afterResolving<T extends UseKey> (key: T, callback: (resolved: Bindings[T], app: this) => void): void;
    abstract afterResolving<T extends abstract new (...args: any[]) => any> (key: T, callback: (resolved: InstanceType<T>, app: this) => void): void;

    /**
     * Register a new before resolving callback for all types.
     *
     * @param  key
     * @param  callback
     */
    abstract beforeResolving<T extends UseKey> (key: T, callback: (app: this) => void): void
    abstract beforeResolving<T extends abstract new (...args: any[]) => any> (key: T, callback: (app: this) => void): void

    /**
     * Determine if a given string is an alias.
     *
     * @param name
     */
    abstract isAlias (name: IBinding): boolean

    /**
     * Get the alias for an abstract if available.
     *
     * @param  abstract
     */
    abstract getAlias (abstract: any): any

    /**
     * Set the alias for an abstract.
     * 
     * @param token 
     * @param target 
     */
    abstract alias (key: [string | ClassConstructor, any][]): this
    abstract alias (key: string | ClassConstructor, target: any): this

    /**
     * Bind a new callback to an abstract's rebind event.
     *
     * @param  abstract
     * @param  callback
     */
    abstract rebinding<T extends UseKey> (key: T | (new (...args: any[]) => Bindings[T]), callback: (app: this, inst: Bindings[T]) => Bindings[T] | void): void
    abstract rebinding<T extends UseKey> (key: T | (abstract new (...args: any[]) => Bindings[T]), callback: (app: this, inst: Bindings[T]) => Bindings[T] | void): void

    /**
     * Determine if the given abstract type has been bound.
     *
     * @param  string  $abstract
     * @returns
     */
    abstract bound<T extends UseKey> (abstract: T): boolean
    abstract bound<C extends abstract new (...args: any[]) => any> (abstract: C): boolean
    abstract bound<F extends (...args: any[]) => any> (abstract: F): boolean

    /**
     * Check if a service is registered
     *
     * @param key
     * @returns
     */
    abstract has<T extends UseKey> (key: T): boolean;
    abstract has<C extends abstract new (...args: any[]) => any> (key: C): boolean;
    abstract has<F extends (...args: any[]) => any> (key: F): boolean;

    /**
     * Determine if the given abstract type has been resolved.
     *
     * @param abstract
     */
    abstract resolved (abstract: IBinding | string): boolean

    /**
     * "Extend" an abstract type in the container.
     *
     * @param  abstract
     * @param  closure
     *
     * @throws {InvalidArgumentException}
     */
    abstract extend<T extends UseKey> (key: T | (new (...args: any[]) => Bindings[T]), closure: (inst: Bindings[T], app: this) => Bindings[T]): void
    abstract extend<T extends UseKey> (key: T | (abstract new (...args: any[]) => Bindings[T]), closure: (inst: Bindings[T], app: this) => Bindings[T]): void

    /**
     * Register an existing instance as shared in the container.
     *
     * @param  abstract
     * @param  instance
     */
    abstract instance<X = any> (key: string, instance: X): X
    abstract instance<K extends abstract new (...args: any[]) => any, X = any> (abstract: K, instance: X): X

    /**
     * Call the given method and inject its dependencies.
     *
     * @param  callback
     */
    abstract call<C extends abstract new (...args: any[]) => any> (callback: C): void | Promise<void>
    abstract call<F extends (...args: any[]) => any> (callback: F): void | Promise<void>
}