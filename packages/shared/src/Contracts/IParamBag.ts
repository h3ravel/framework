import { H3Event } from 'h3'
import { RequestObject } from './IHttp'

export declare class IParamBag implements Iterable<[string, any]> {
    /**
     * The current H3 H3Event instance
     */
    readonly event: H3Event
    constructor(
        parameters: RequestObject | undefined,
        /**
         * The current H3 H3Event instance
         */
        event: H3Event
    );
    /**
     * Returns the parameters.
     * @
     * @param key The name of the parameter to return or null to get them all
     *
     * @throws BadRequestException if the value is not an array
     */
    all (key?: string): any;
    get (key: string, defaultValue?: any): any;
    set (key: string, value: any): void;
    /**
     * Returns true if the parameter is defined.
     *
     * @param key
     */
    has (key: string): boolean;
    /**
     * Removes a parameter.
     *
     * @param key
     */
    remove (key: string): void;
    /**
     *
     * Returns the parameter as string.
     *
     * @param key
     * @param defaultValue
     * @throws UnexpectedValueException if the value cannot be converted to string
     * @returns
     */
    getString (key: string, defaultValue?: string): string;
    /**
     * Returns the parameter value converted to integer.
     *
     * @param key
     * @param defaultValue
     * @throws UnexpectedValueException if the value cannot be converted to integer
     */
    getInt (key: string, defaultValue?: number): number;
    /**
     * Returns the parameter value converted to boolean.
     *
     * @param key
     * @param defaultValue
     * @throws UnexpectedValueException if the value cannot be converted to a boolean
     */
    getBoolean (key: string, defaultValue?: boolean): boolean;
    /**
     * Returns the alphabetic characters of the parameter value.
     *
     * @param key
     * @param defaultValue
     * @throws UnexpectedValueException if the value cannot be converted to string
     */
    getAlpha (key: string, defaultValue?: string): string;
    /**
     * Returns the alphabetic characters and digits of the parameter value.
     *
     * @param key
     * @param defaultValue
     * @throws UnexpectedValueException if the value cannot be converted to string
     */
    getAlnum (key: string, defaultValue?: string): string;
    /**
     * Returns the digits of the parameter value.
     *
     * @param key
     * @param defaultValue
     * @throws UnexpectedValueException if the value cannot be converted to string
     * @returns
     **/
    getDigits (key: string, defaultValue?: string): string;
    /**
     * Returns the parameter keys.
     */
    keys (): string[];
    /**
     * Replaces the current parameters by a new set.
     */
    replace (parameters?: RequestObject): void;
    /**
     * Adds parameters.
     */
    add (parameters?: RequestObject): void;
    /**
     * Returns the number of parameters.
     */
    count (): number;
    /**
     * Returns an iterator for parameters.
     *
     * @returns
     */
    [Symbol.iterator] (): ArrayIterator<[string, any]>;
}