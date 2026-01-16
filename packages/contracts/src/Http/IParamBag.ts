import type { H3Event } from 'h3'
import type { RequestObject } from '../Utilities/Utilities'

/**
 * ParamBag is a container for key/value pairs
 * for H3ravel App.
 */
export abstract class IParamBag implements Iterable<[string, any]> {
    /**
     * The current H3 H3Event instance
     */
    abstract readonly event: H3Event
    /**
     * Returns the parameters.
     * @
     * @param key The name of the parameter to return or null to get them all
     *
     * @throws BadRequestException if the value is not an array
     */
    abstract all (key?: string): any;
    abstract get (key: string, defaultValue?: any): any;
    abstract set (key: string, value: any): void;
    /**
     * Returns true if the parameter is defined.
     *
     * @param key
     */
    abstract has (key: string): boolean;
    /**
     * Removes a parameter.
     *
     * @param key
     */
    abstract remove (key: string): void;
    /**
     *
     * Returns the parameter as string.
     *
     * @param key
     * @param defaultValue
     * @throws UnexpectedValueException if the value cannot be converted to string
     * @returns
     */
    abstract getString (key: string, defaultValue?: string): string;
    /**
     * Returns the parameter value converted to integer.
     *
     * @param key
     * @param defaultValue
     * @throws UnexpectedValueException if the value cannot be converted to integer
     */
    abstract getInt (key: string, defaultValue?: number): number;
    /**
     * Returns the parameter value converted to boolean.
     *
     * @param key
     * @param defaultValue
     * @throws UnexpectedValueException if the value cannot be converted to a boolean
     */
    abstract getBoolean (key: string, defaultValue?: boolean): boolean;
    /**
     * Returns the alphabetic characters of the parameter value.
     *
     * @param key
     * @param defaultValue
     * @throws UnexpectedValueException if the value cannot be converted to string
     */
    abstract getAlpha (key: string, defaultValue?: string): string;
    /**
     * Returns the alphabetic characters and digits of the parameter value.
     *
     * @param key
     * @param defaultValue
     * @throws UnexpectedValueException if the value cannot be converted to string
     */
    abstract getAlnum (key: string, defaultValue?: string): string;
    /**
     * Returns the digits of the parameter value.
     *
     * @param key
     * @param defaultValue
     * @throws UnexpectedValueException if the value cannot be converted to string
     * @returns
     **/
    abstract getDigits (key: string, defaultValue?: string): string;
    /**
     * Returns the parameter keys.
     */
    abstract keys (): string[];
    /**
     * Replaces the current parameters by a new set.
     */
    abstract replace (parameters?: RequestObject): void;
    /**
     * Adds parameters.
     */
    abstract add (parameters?: RequestObject): void;
    /**
     * Returns the number of parameters.
     */
    abstract count (): number;
    /**
     * Returns an iterator for parameters.
     *
     * @returns
     */
    abstract [Symbol.iterator] (): ArrayIterator<[string, any]>;
}