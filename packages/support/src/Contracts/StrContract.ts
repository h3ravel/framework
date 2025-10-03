/**
 * Converts CamelCased strings to snake_case
 */
export type CamelToSnakeCase<S extends string> =
    S extends `${infer T}${infer U}` ?
    U extends Uncapitalize<U> ? `${Uncapitalize<T>}${CamelToSnakeCase<U>}` : `${Uncapitalize<T>}_${CamelToSnakeCase<U>}` :
    S;

/**
 * Converts snake_cased strings to camelCase
 */
export type SnakeToCamelCase<S extends string> =
    S extends `${infer T}_${infer U}` ? `${T}${Capitalize<SnakeToCamelCase<U>>}` : S;

/**
 * Converts snake_cased strings to TitleCasea
 */
export type SnakeToTitleCase<S extends string> = S extends `${infer First}_${infer Rest}`
    ? `${Capitalize<Lowercase<First>>}${SnakeToTitleCase<Rest>}`
    : Capitalize<Lowercase<S>>;

export type HtmlStringType = HTMLElement | Node | string;

export type ExcerptOptions = { radius?: number, omission?: string }

export type Value<T> = boolean | ((instance: T) => boolean);

export type Callback<T> = (instance: T, value: boolean) => T | void | undefined;

export type Fallback<T> = Callback<T> | null;

export interface Function {
    (...args: any[]): any
}
