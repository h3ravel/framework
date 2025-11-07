import { RuleSet, ValidationRuleName } from './ValidationRuleName'

/**
 * Parse rule names from rule string or string[] definitions
 */
export type ExtractRules<R> =
    R extends string
    ? R extends `${infer Head}|${infer Tail}`
    ? Head extends `${infer Rule}:${string}`
    ? Rule | ExtractRules<Tail>
    : Head | ExtractRules<Tail>
    : R extends `${infer Rule}:${string}`
    ? Rule
    : R
    : R extends string[]
    ? ExtractRules<R[number]>
    : never

/**
 * Flatten data structure into dot-notation keys
 * including wildcards (*) for arrays.
 */
export type DotPaths<T, Prefix extends string = ''> = {
    [K in keyof T & string]:
    T[K] extends (infer A)[]
    ? | `${Prefix}${K}`
    | `${Prefix}${K}.*`
    | (A extends Record<string, any>
        ? `${Prefix}${K}.*.${DotPaths<A>}`
        : never)
    : T[K] extends Record<string, any>
    ? | `${Prefix}${K}`
    | `${Prefix}${K}.${DotPaths<T[K]>}`
    : `${Prefix}${K}`
}[keyof T & string]

/**
* Builds message keys only for rules used on that field
*/
export type FieldMessages<Field extends string, R> =
    | `${Field}`
    | `${Field}.${ExtractRules<R> & ValidationRuleName}`

/**
* Build all valid message keys for a given rules object
*/
export type MessagesForRules<Rules extends Record<string, any>> = {
    [K in keyof Rules & string]: FieldMessages<K, Rules[K]>
}[keyof Rules & string]

/**
 * Make rules align with keys in the data object
 */
export type RulesForData<D extends Record<string, any>> = Partial<
    Record<DotPaths<D>, RuleSet>
>