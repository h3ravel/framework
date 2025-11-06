import { BadRequestException } from '../Exceptions/BadRequestException'
import { H3Event } from 'h3'
import { Obj } from '@h3ravel/support'
import { ParamBag } from './ParamBag'
import { RequestObject } from '@h3ravel/shared'

/**
 * InputBag is a container for user input values
 * (e.g., query params, body, cookies)
 * for Node/H3 environments.
 */
export class InputBag extends ParamBag {
    constructor(
        inputs: RequestObject = {},
        /**
         * The current H3 H3Event instance
         */
        event: H3Event
    ) {
        super(inputs, event)
        this.add(inputs)
    }

    /**
     * Returns a scalar input value by name.
     *
     * @param key 
     * @param defaultValue 
     * @throws BadRequestException if the input contains a non-scalar value
     * @returns 
     */
    public get<T extends string | number | boolean | null> (
        key: string,
        defaultValue: T | null = null
    ): T | string | number | boolean | null {
        if (
            defaultValue !== null &&
            typeof defaultValue !== 'string' &&
            typeof defaultValue !== 'number' &&
            typeof defaultValue !== 'boolean'
        ) {
            throw new TypeError(
                `Expected a scalar value as 2nd argument to get(), got ${typeof defaultValue}`
            )
        }

        const value = Obj.get(this.parameters, key, defaultValue)

        if (
            value !== null &&
            typeof value !== 'string' &&
            typeof value !== 'number' &&
            typeof value !== 'boolean'
        ) {
            throw new BadRequestException(
                `Input value "${key}" contains a non-scalar value.`
            )
        }

        return value
    }

    /**
     * Replaces all current input values.
     * 
     * @param inputs 
     * @returns
     */
    public replace (inputs: RequestObject = {}): void {
        this.parameters = {}
        this.add(inputs)
    }

    /**
     * Adds multiple input values.
     * 
     * @param inputs 
     * @returns
     */
    public add (inputs: RequestObject = {}): void {
        Object.entries(inputs).forEach(([key, value]) => this.set(key, value))
    }

    /**
     * Sets an input by name.
     *
     * @param key 
     * @param value 
     * @throws TypeError if value is not scalar or array
     * @returns
     */
    public set (key: string, value: any): void {
        if (
            value !== null &&
            typeof value !== 'string' &&
            typeof value !== 'number' &&
            typeof value !== 'boolean' &&
            !Array.isArray(value) &&
            typeof value !== 'object'
        ) {
            throw new TypeError(
                `Expected scalar, array, object, or null as value for set(), got ${typeof value}`
            )
        }

        this.parameters[key] = value
    }

    /**
     * Returns true if a key exists.
     * 
     * @param key 
     * @returns
     */
    public has (key: string): boolean {
        return Object.prototype.hasOwnProperty.call(this.parameters, key)
    }

    /**
     * Returns all parameters.
     * 
     * @returns
     */
    public all (): RequestObject {
        return { ...this.parameters }
    }

    /**
     * Converts a parameter value to string.
     *
     * @param key 
     * @param defaultValue 
     * @throws BadRequestException if input contains a non-scalar value
     * @returns
     */
    public getString (key: string, defaultValue = ''): string {
        const value = this.get(key, defaultValue)
        return String(value ?? '')
    }

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
    public filter<T = any> (
        key: string,
        defaultValue: T | null = null,
        filterFn?: (value: any) => boolean
    ): T | null {
        const value = this.has(key) ? this.parameters[key] : defaultValue

        if (Array.isArray(value)) {
            throw new BadRequestException(
                `Input value "${key}" contains an array, but array filtering not allowed.`
            )
        }

        if (filterFn && !filterFn(value)) {
            throw new BadRequestException(
                `Input value "${key}" is invalid and did not pass filter.`
            )
        }

        return value
    }

    /**
     * Returns an enum value by key.
     *
     * @param key 
     * @param EnumClass 
     * @param defaultValue 
     * @throws BadRequestException if conversion fails
     * @returns 
     */
    public getEnum<T extends Record<string, string | number>> (
        key: string,
        EnumClass: T,
        defaultValue: T[keyof T] | null = null
    ): T[keyof T] | null {
        const value = this.get(key, defaultValue as any)
        if (value === null) return defaultValue

        const validValues = Object.values(EnumClass)
        if (!validValues.includes(value as any)) {
            throw new BadRequestException(
                `Input "${key}" cannot be converted to enum.`
            )
        }

        return value as T[keyof T]
    }

    /**
     * Removes a key.
     *
     * @param key 
     */
    public remove (key: string): void {
        delete this.parameters[key]
    }

    /**
     * Returns all keys.
     * 
     * @returns
     */
    public keys (): string[] {
        return Object.keys(this.parameters)
    }

    /**
     * Returns number of parameters.
     * 
     * @returns
     */
    public count (): number {
        return this.keys().length
    }
}
