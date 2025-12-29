import { HigherOrderTapProxy } from './HigherOrderTapProxy'

/**
 * Call the given Closure with the given value then return the value.
 *
 * @param  value
 * @param  callback
 */
interface Tap {
    <X extends Record<string, any>> (value: X): HigherOrderTapProxy<X>
    <X extends Record<string, any>> (value: X, callback?: (val: X) => void): X
}

export const tap: Tap = <X> (value: any, callback?: (val: X) => void) => {
    if (!callback) {
        return new HigherOrderTapProxy(value)
    }

    callback(value)

    return value
}

export const isClass = (C: any): C is new (...args: any[]) => any => {
    return typeof C === 'function' &&
        C.prototype !== undefined &&
        Object.toString.call(C).substring(0, 5) === 'class'
}

export const isAbstract = (C: any): C is new (...args: any[]) => any => {
    return isClass(C) && C.name.startsWith('I')
}

export const isCallable = (C: any): C is (...args: any[]) => any => {
    return typeof C === 'function' && !isClass(C)
}