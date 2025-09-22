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

export default {}
