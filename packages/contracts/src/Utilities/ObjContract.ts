/**
 * Adds a dot prefix to nested keys
 */
type DotPrefix<T extends string, U extends string> =
    T extends '' ? U : `${T}.${U}`

/**
 * Converts a union of objects into a single merged object
 */
type MergeUnion<T> =
    (T extends any ? (k: T) => void : never) extends
    (k: infer I) => void ? { [K in keyof I]: I[K] } : never

/**
 * Flattens nested objects into dotted keys
 */
export type DotFlatten<T, Prefix extends string = ''> = MergeUnion<{
    [K in keyof T & string]:
    T[K] extends Record<string, any>
    ? DotFlatten<T[K], DotPrefix<Prefix, K>>
    : { [P in DotPrefix<Prefix, K>]: T[K] }
}[keyof T & string]>

/**
 * Builds "nested.key" paths for autocompletion
 */
export type DotNestedKeys<T> = {
    [K in keyof T & string]:
    T[K] extends object
    ? `${K}` | `${K}.${DotNestedKeys<T[K]>}`
    : `${K}`
}[keyof T & string]

/**
 * Retrieves type at a given dot-path
 */
export type DotNestedValue<T, Path extends string> =
    Path extends `${infer Key}.${infer Rest}`
    ? Key extends keyof T
    ? DotNestedValue<T[Key], Rest>
    : never
    : Path extends keyof T
    ? T[Path]
    : never

/**
 * A generic object type that supports nullable string values
 */
export interface GenericWithNullableStringValues {
    [name: string]: string | undefined;
}
