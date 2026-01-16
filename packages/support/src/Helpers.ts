import { Nullable, OptionalFn, OptionalProxy, Tap } from './Contracts/Helpers'

import { HigherOrderTapProxy } from './HigherOrderTapProxy'

/**
 * Call the given Closure with the given value then return the value.
 *
 * @param  value
 * @param  callback
 */
export const tap: Tap = <X> (value: any, callback?: (val: X) => void) => {
    if (!callback) {
        return new HigherOrderTapProxy(value)
    }

    callback(value)

    return value
}

/**
 * Optional Proxy factory
 * 
 * @param value 
 * @returns 
 */
export const createOptionalProxy = <T> (value: Nullable<T>): OptionalProxy<T> => {
    const handler: ProxyHandler<any> = {
        get (_, prop) {
            if (prop === 'value') {
                return () => value ?? undefined
            }

            if (value == null) {
                return createOptionalProxy(undefined)
            }

            const result = (value as any)[prop]

            if (typeof result === 'function') {
                return (...args: any[]) => {
                    try {
                        return createOptionalProxy(result.apply(value, args))
                    } catch {
                        return createOptionalProxy(undefined)
                    }
                }
            }

            return createOptionalProxy(result)
        }
    }

    return new Proxy({}, handler) as OptionalProxy<T>
}

/**
 * Provide access to optional objects.
 *
 * @param  value
 * @param  callback
 */
export const optional: OptionalFn = <T, R> (value: Nullable<T>, callback?: (value: T) => R) => {
    if (callback) {
        return value != null ? callback(value) : undefined
    }

    return createOptionalProxy(value)
}

/**
 * Variadic helper function
 *
 * @param args
 */
export default function variadic<X> (args: X[]) {
    if (Array.isArray(args[0])) {
        return args[0]
    }

    return args
}

/**
 * Checks if the givevn value is a class
 * 
 * @param C  
 */
export const isClass = (C: any): C is new (...args: any[]) => any => {
    return typeof C === 'function' &&
        C.prototype !== undefined &&
        Object.toString.call(C).substring(0, 5) === 'class'
}

/**
 * Checks if the givevn value is an abstract class
 * 
 * @param C  
 */
export const isAbstract = (C: any): C is new (...args: any[]) => any => {
    return isClass(C) && C.name.startsWith('I')
}

/**
 * Checks if the givevn value is callable
 * 
 * @param C  
 */
export const isCallable = (C: any): C is (...args: any[]) => any => {
    return typeof C === 'function' && !isClass(C)
}