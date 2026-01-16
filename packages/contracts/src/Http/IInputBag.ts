import { IParamBag } from './IParamBag'
import { RequestObject } from '../Utilities/Utilities'

/**
 * InputBag is a container for user input values
 * (e.g., query params, body, cookies)
 * for H3ravel App.
 */
export abstract class InputBag extends IParamBag {
    /**
     * Returns a scalar input value by name.
     *
     * @param key
     * @param defaultValue
     * @throws BadRequestException if the input contains a non-scalar value
     * @returns
     */
    abstract get<T extends string | number | boolean | null> (key: string, defaultValue?: T | null): T | string | number | boolean | null;
    /**
     * Replaces all current input values.
     *
     * @param inputs
     * @returns
     */
    abstract replace (inputs?: RequestObject): void;
    /**
     * Adds multiple input values.
     *
     * @param inputs
     * @returns
     */
    abstract add (inputs?: RequestObject): void;
    /**
     * Sets an input by name.
     *
     * @param key
     * @param value
     * @throws TypeError if value is not scalar or array
     * @returns
     */
    abstract set (key: string, value: any): void;
    /**
     * Returns true if a key exists.
     *
     * @param key
     * @returns
     */
    abstract has (key: string): boolean;
    /**
     * Returns all parameters.
     *
     * @returns
     */
    abstract all (): RequestObject;
    /**
     * Converts a parameter value to string.
     *
     * @param key
     * @param defaultValue
     * @throws BadRequestException if input contains a non-scalar value
     * @returns
     */
    abstract getString (key: string, defaultValue?: string): string;
    /**
     * Filters input value with a predicate.
     * Mimics PHP’s filter_var() in spirit, but simpler.
     *
     * @param key
     * @param defaultValue
     * @param filterFn
     * @throws BadRequestException if validation fails
     * @returns
     */
    abstract filter<T = any> (key: string, defaultValue?: T | null, filterFn?: (value: any) => boolean): T | null;
    /**
     * Returns an enum value by key.
     *
     * @param key
     * @param EnumClass
     * @param defaultValue
     * @throws BadRequestException if conversion fails
     * @returns
     */
    abstract getEnum<T extends Record<string, string | number>> (key: string, EnumClass: T, defaultValue?: T[keyof T] | null): T[keyof T] | null;
    /**
     * Removes a key.
     *
     * @param key
     */
    abstract remove (key: string): void;
    /**
     * Returns all keys.
     *
     * @returns
     */
    abstract keys (): string[];
    /**
     * Returns number of parameters.
     *
     * @returns
     */
    abstract count (): number;
}