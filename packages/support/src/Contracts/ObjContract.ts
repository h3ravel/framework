import type { CamelToSnakeCase } from './StrContract'

/**
 * Convert CamelCased Object keys to snake_case
 */
export type KeysToSnakeCase<T> = {
    [K in keyof T as CamelToSnakeCase<string & K>]: T[K]
}

export type TGeneric<V = any, K extends string = string> = Record<K, V>

export type XGeneric<V = TGeneric, T = any> = {
    [key: string]: T
} & V

export type DotPath<T> = T extends object
    ? {
        [K in keyof T & (string | number)]:
        T[K] extends object
        ? `${K}` | `${K}.${DotPath<T[K]>}`
        : `${K}`
    }[keyof T & (string | number)]
    : never;

export default {}
