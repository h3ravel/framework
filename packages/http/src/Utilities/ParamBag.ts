import { IParamBag, RequestObject } from '@h3ravel/contracts'

import { BadRequestException } from '../Exceptions/BadRequestException'
import { H3Event } from 'h3'
import { UnexpectedValueException } from '../Exceptions/UnexpectedValueException'

/**
 * ParamBag is a container for key/value pairs
 * for Node/H3 environments.
 */
export class ParamBag implements IParamBag {
    constructor(
        protected parameters: RequestObject = {},
        /**
         * The current H3 H3Event instance
         */
        public readonly event: H3Event
    ) {
        this.parameters = { ...parameters }
    }

    /**
     * Returns the parameters.
     * @
     * @param key The name of the parameter to return or undefined to get them all
     *
     * @throws BadRequestException if the value is not an array
     */
    all (key?: string) {
        if (!key) return { ...this.parameters }
        const value = key ? this.parameters[key] : undefined
        if (value && typeof value !== 'object') {
            throw new BadRequestException(`Unexpected value for parameter "${key}": expected object, got ${typeof value}`)
        }
        return value || {}
    }

    get (key: string, defaultValue?: any) {
        return key in this.parameters ? this.parameters[key] : defaultValue
    }

    set (key: string, value: any) {
        this.parameters[key] = value
    }

    /**
     * Returns true if the parameter is defined.
     * 
     * @param key  
     */
    has (key: string) {
        return Object.prototype.hasOwnProperty.call(this.parameters, key)
    }

    /**
     * Removes a parameter.
     * 
     * @param key  
     */
    remove (key: string) {
        delete this.parameters[key]
    }

    /**
     * 
     * Returns the parameter as string.
     *
     * @param key 
     * @param defaultValue 
     * @throws UnexpectedValueException if the value cannot be converted to string
     * @returns 
     */
    getString (key: string, defaultValue: string = '') {
        const value = this.get(key, defaultValue)
        if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean')
            return String(value)
        throw new UnexpectedValueException(`Parameter "${key}" cannot be converted to string`)
    }

    /**
     * Returns the parameter value converted to integer.
     *
     * @param key 
     * @param defaultValue 
     * @throws UnexpectedValueException if the value cannot be converted to integer
     */
    getInt (key: string, defaultValue: number = 0) {
        const value = parseInt(this.get(key, defaultValue), 10)
        if (isNaN(value)) throw new Error(`Parameter "${key}" is not an integer`)
        return value
    }

    /**
     * Returns the parameter value converted to boolean.
     *
     * @param key 
     * @param defaultValue 
     * @throws UnexpectedValueException if the value cannot be converted to a boolean
     */
    getBoolean (key: string, defaultValue: boolean = false) {
        const value = this.get(key, defaultValue)
        if (typeof value === 'boolean') return value
        if (['1', 'true', 'yes'].includes(String(value).toLowerCase())) return true
        if (['0', 'false', 'no'].includes(String(value).toLowerCase())) return false
        throw new Error(`Parameter "${key}" cannot be converted to boolean`)
    }

    /**
     * Returns the alphabetic characters of the parameter value.
     *
     * @param key 
     * @param defaultValue 
     * @throws UnexpectedValueException if the value cannot be converted to string
     */
    getAlpha (key: string, defaultValue: string = '') {
        return this.getString(key, defaultValue).replace(/[^a-z]/gi, '')
    }

    /**
     * Returns the alphabetic characters and digits of the parameter value.
     *
     * @param key 
     * @param defaultValue 
     * @throws UnexpectedValueException if the value cannot be converted to string
     */
    getAlnum (key: string, defaultValue: string = '') {
        return this.getString(key, defaultValue).replace(/[^a-z0-9]/gi, '')
    }

    /**
     * Returns the digits of the parameter value.
     * 
     * @param key 
     * @param defaultValue 
     * @throws UnexpectedValueException if the value cannot be converted to string
     * @returns 
     **/
    getDigits (key: string, defaultValue: string = '') {
        return this.getString(key, defaultValue).replace(/\D/g, '')
    }

    /**
     * Returns the parameter keys.
     */
    keys () {
        return Object.keys(this.parameters)
    }

    /**
     * Replaces the current parameters by a new set.
     */
    replace (parameters: RequestObject = {}) {
        this.parameters = { ...parameters }
    }

    /**
     * Adds parameters.
     */
    add (parameters: RequestObject = {}) {
        this.parameters = { ...this.parameters, ...parameters }
    }

    /**
     * Returns the number of parameters.
     */
    count () {
        return Object.keys(this.parameters).length
    }

    /**
     * Returns an iterator for parameters.
     *
     * @returns 
     */
    [Symbol.iterator] () {
        return Object.entries(this.parameters)[Symbol.iterator]()
    }
}
