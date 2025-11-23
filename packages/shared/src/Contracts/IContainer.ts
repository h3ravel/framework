import type { Bindings, UseKey } from './BindingsContract'
import { IExceptionHandler } from './IExceptionHandler'
import { IMiddlewareHandler } from './IMiddlewareHandler'

export type IContainerBinding = UseKey | (new (..._args: any[]) => unknown)

/**
 * Interface for the Container contract, defining methods for dependency injection and service resolution.
 */
export interface IContainer {
    bindings: Map<IContainerBinding, () => unknown>
    singletons: Map<IContainerBinding, unknown>
    exceptionHandler?: IExceptionHandler
    middlewareHandler?: IMiddlewareHandler

    /**
     * Binds a transient service to the container.
     * 
     * @param key - The key or constructor for the service.
     * @param factory - The factory function to create the service instance.
     */
    bind<T> (key: new (...args: any[]) => T, factory: () => T): void;
    bind<T extends UseKey> (key: T, factory: () => Bindings[T]): void;

    /**
     * Remove one or more transient services from the container
     * 
     * @param key 
     */
    unbind<T extends UseKey> (key: T | T[]): void

    /**
     * Binds a singleton service to the container.
     * @param key - The key or constructor for the service.
     * @param factory - The factory function to create the singleton instance.
     */
    singleton<T extends UseKey> (
        key: T | (new (..._args: any[]) => Bindings[T]),
        factory: (app: this) => Bindings[T]
    ): void;

    /**
     * Resolves a service from the container.
     * 
     * @param key - The key or constructor for the service.
     * @returns The resolved service instance.
     */
    make<T extends UseKey> (key: T): Bindings[T]
    make<C extends abstract new (...args: any[]) => any> (key: C): InstanceType<C>
    make<F extends (...args: any[]) => any> (key: F): ReturnType<F>/**

     * Register a callback to be executed after a service is resolved
     * 
     * @param key 
     * @param callback 
     */
    afterResolving<T extends UseKey> (
        key: T | (new (..._args: any[]) => Bindings[T]),
        callback: (resolved: Bindings[T], app: this) => void
    ): void

    /**
     * Checks if a service is registered in the container.
     * @param key - The key to check.
     * @returns True if the service is registered, false otherwise.
     */
    has<C extends abstract new (...args: any[]) => any> (key: C): boolean
    has<F extends (...args: any[]) => any> (key: F): boolean
    has<T extends UseKey> (key: T): boolean
}
