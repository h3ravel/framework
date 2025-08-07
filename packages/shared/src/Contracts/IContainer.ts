import type { Bindings, UseKey } from './BindingsContract';

/**
 * Interface for the Container contract, defining methods for dependency injection and service resolution.
 */
export interface IContainer {
    /**
     * Binds a transient service to the container.
     * @param key - The key or constructor for the service.
     * @param factory - The factory function to create the service instance.
     */
    bind<T> (key: new (...args: any[]) => T, factory: () => T): void;
    bind<T extends UseKey> (key: T, factory: () => Bindings[T]): void;

    /**
     * Binds a singleton service to the container.
     * @param key - The key or constructor for the service.
     * @param factory - The factory function to create the singleton instance.
     */
    singleton<T extends UseKey> (
        key: T | (new (...args: any[]) => Bindings[T]),
        factory: () => Bindings[T]
    ): void;

    /**
     * Resolves a service from the container.
     * @param key - The key or constructor for the service.
     * @returns The resolved service instance.
     */
    make<T extends UseKey, X = undefined> (
        key: T | (new (..._args: any[]) => Bindings[T])
    ): X extends undefined ? Bindings[T] : X

    /**
     * Checks if a service is registered in the container.
     * @param key - The key to check.
     * @returns True if the service is registered, false otherwise.
     */
    has (key: UseKey): boolean;
}
