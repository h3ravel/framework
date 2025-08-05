import { CamelToSnakeCase } from './StrContract'

export type { DotFlatten } from '@h3ravel/shared'
export type { DotNestedKeys } from '@h3ravel/shared'
export type { DotNestedValue } from '@h3ravel/shared'

/**
 * Convert CamelCased Object keys to snake_case
 */
export type KeysToSnakeCase<T> = {
    [K in keyof T as CamelToSnakeCase<string & K>]: T[K]
}
