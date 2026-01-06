import type { HigherOrderTapProxy } from '../HigherOrderTapProxy'

export interface Tap {
    <X extends Record<string, any>> (value: X): HigherOrderTapProxy<X>
    <X extends Record<string, any>> (value: X, callback?: (val: X) => void): X
}

export interface OptionalFn {
    <T> (value: Nullable<T>): OptionalProxy<T>
    <T, R> (value: Nullable<T>, callback: (value: T) => R): R | undefined
}

export type Macro = (...args: any[]) => any

export type MacroMap = Record<string, (...args: any[]) => any>

export type WithMacros<M extends MacroMap> = {
    [K in keyof M]: M[K]
}

export type Nullable<T> = T | null | undefined

export type OptionalProxy<T> = {
    [K in keyof T]: T[K] extends (...args: infer A) => infer R
    ? (...args: A) => OptionalProxy<R>
    : OptionalProxy<T[K]>
} & {
    value (): T | undefined
}