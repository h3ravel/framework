import type { DotFlatten, DotNestedKeys, DotNestedValue } from '@h3ravel/shared'
import type { DotPath, KeysToSnakeCase } from '../Contracts/ObjContract'

/**
 * Flattens a nested object into a single-level object
 * with dot-separated keys.
 *
 * Example:
 * dot({
 *   user: { name: "John", address: { city: "NY" } },
 *   active: true
 * })
 * 
 * Output:
 * {
 *   "user.name": "John",
 *   "user.address.city": "NY",
 *   "active": true
 * }
 *
 * @template T - The type of the input object
 * @param obj - The nested object to flatten
 * @returns A flattened object with dotted keys and inferred types
 */
export const dot = <T extends Record<string, any>> (obj: T): DotFlatten<T> => {
    const result = {} as Record<string, unknown>

    /**
     * Internal recursive function to traverse and flatten the object.
     * 
     * @param o - Current object to flatten
     * @param prefix - Key path accumulated so far
     */
    const recurse = (o: Record<string, any>, prefix = ''): void => {
        for (const [key, value] of Object.entries(o)) {
            const newKey = prefix ? `${prefix}.${key}` : key

            /**
             * Recurse if the value is a plain object
             */
            if (value && typeof value === 'object' && !Array.isArray(value)) {
                recurse(value, newKey)
            } else {
                /**
                 * Otherwise, assign directly
                 */
                result[newKey] = value
            }
        }
    }

    recurse(obj)
    return result as DotFlatten<T>
}

/**
 * Extracts a subset of properties from an object.
 *
 * @template T - Type of the source object
 * @template K - Keys of T to extract
 * @param obj - The source object
 * @param keys - Array of keys to extract
 * @returns A new object with only the specified keys
 */
export const extractProperties = <T extends object, K extends keyof T> (
    obj: T,
    keys: readonly K[] = []
): Pick<T, K> => {
    return Object.fromEntries(
        keys.map(key => [key, obj[key]])
    ) as Pick<T, K>
}

/**
 * Safely retrieves a value from an object by key or nested keys.
 *
 * @template T - Type of the source object
 * @param key - Single key or tuple [parentKey, childKey]
 * @param item - The source object
 * @returns The found value as a string or the key itself if not found
 */
export const getValue = <
    T extends Record<string, any> // Allow nested objects
> (
    key: string | [keyof T, keyof T[string]],
    item: T
): string => {
    if (Array.isArray(key)) {
        const [parent, child] = key

        if (child !== undefined) {
            // Access nested property: item[parent][child]
            return (
                String(item?.[parent]?.[child] ??
                    item?.[parent] ??
                    `${String(parent)}.${String(child)}`)
            )
        }

        // Only top-level key
        return String(item?.[parent] ?? parent)
    }

    // Single key access
    return String(item?.[key] ?? key)
}

/**
 * Maps over an object's entries and returns a new object 
 * with transformed keys and/or values.
 *
 * @template T - Type of the input object
 * @template R - Type of the new values
 * @param obj - The object to transform
 * @param callback - Function that receives [key, value] and returns [newKey, newValue]
 * @returns A new object with transformed entries
 */
export const modObj = <T extends object, R> (
    obj: T,
    callback: (_entry: [keyof T & string, T[keyof T]]) => [string, R]
): Record<string, R> => {
    return Object.fromEntries(
        Object.entries(obj).map(([key, value]) =>
            callback([key as keyof T & string, value as T[keyof T]])
        )
    ) as Record<string, R>
}

/**
 * Safely convert an object to dot notation
 * 
 * @param data 
 */
export function safeDot<T extends Record<string, any>> (data: T): T
export function safeDot<
    T extends Record<string, any>,
    K extends DotNestedKeys<T>
> (data: T, key?: K): DotNestedValue<T, K>
export function safeDot<
    T extends Record<string, any>,
    K extends DotNestedKeys<T>
> (data: T, key?: K): any {
    if (!key) return data
    return key.split('.').reduce((acc: any, k) => acc?.[k], data)
}

/**
 * Sets a nested property on an object using dot notation.
 * 
 * @example
 * const obj = {}
 * setNested(obj, 'app.user.name', 'Legacy')
 * console.log(obj)
 * // Output: { app: { user: { name: 'Legacy' } } }
 * 
 * @param obj - The target object to modify.
 * @param key - The dot-separated key (e.g., 'app.user.name').
 * @param value - The value to set at the specified path.
 */
export const setNested = (
    obj: Record<string, any>,
    key: string,
    value: any
): void => {
    if (!key.includes('.')) {
        obj[key] = value
        return
    }

    const parts = key.split('.')
    let current = obj

    for (let i = 0; i < parts.length; i++) {
        const part = parts[i]

        /**
         * If we're at the last key, assign the value
         */
        if (i === parts.length - 1) {
            current[part] = value
        } else {
            /**
             * If the key doesn't exist or isn't an object, create it
             */
            if (typeof current[part] !== 'object' || current[part] === null) {
                current[part] = {}
            }
            current = current[part]
        }
    }
}

/**
 * Converts object keys to a slugified format (e.g., snake_case).
 *
 * @template T - Type of the input object
 * @param obj - The object whose keys will be slugified
 * @param only - Optional array of keys to slugify (others remain unchanged)
 * @param separator - Separator for slugified keys (default: "_")
 * @returns A new object with slugified keys
 */
export const slugifyKeys = <T extends object> (
    obj: T,
    only: string[] = [],
    separator: string = '_'
): KeysToSnakeCase<T> => {
    const slugify = (key: string): string =>
        key
            .replace(/([a-z])([A-Z])/g, `$1${separator}$2`) // Handle camelCase
            .replace(/[\s\W]+/g, separator)                 // Replace spaces/symbols
            .replace(new RegExp(`${separator}{2,}`, 'g'), separator) // Remove duplicate separators
            .replace(new RegExp(`^${separator}|${separator}$`, 'g'), '') // Trim edges
            .toLowerCase()

    let entries = Object.entries(obj)

    // Filter if `only` is provided
    if (only.length) {
        entries = entries.filter(([key]) => only.includes(key))
    }

    return Object.fromEntries(
        entries.map(([key, value]) => [slugify(key), value])
    ) as KeysToSnakeCase<T>
}

/**
 * toCssClasses
 *
 * Convert array/object/string input into a CSS class string.
 * - Arrays: included if truthy
 * - Objects: keys included if value is truthy
 * - Strings: included as-is
 * 
 * @param input 
 * @returns 
 */
export function toCssClasses<T extends string | Record<string, boolean> | Array<string | false | null | undefined>> (
    input: T
): string {
    if (!input) return ''
    const classes: string[] = []

    if (typeof input === 'string') {
        return input.trim()
    }

    if (Array.isArray(input)) {
        input.forEach(item => {
            if (item) classes.push(String(item).trim())
        })
    } else if (typeof input === 'object') {
        for (const [key, value] of Object.entries(input)) {
            if (value) classes.push(key)
        }
    }

    return classes.join(' ')
}

/**
 * toCssStyles
 *
 * Convert object input into CSS style string.
 * - Only includes truthy values (ignores null/undefined/false)
 * 
 * @param styles 
 * @returns 
 */
export function toCssStyles<T extends Record<string, string | number | boolean | null | undefined>> (styles: T): string {
    const parts: string[] = []
    for (const [k, v] of Object.entries(styles)) {
        if (v === null || v === undefined || v === false) continue
        parts.push(`${k}:${v}`)
    }
    return parts.join(';')
}

/**
 * undot
 *
 * Convert a dot-notated object back into nested structure.
 *
 * Example:
 * undot({ 'a.b': 1, 'c.0': 2 }) -> { a: { b: 1 }, c: [2] }
 * 
 * @param obj 
 * @returns 
 */
export function undot (obj: Record<string, any>): Record<string, any> {
    const result: Record<string, any> = {}

    for (const [key, value] of Object.entries(obj)) {
        const parts = key.split('.')
        let node: any = result

        for (let i = 0; i < parts.length; i++) {
            const part = parts[i]
            const isLast = i === parts.length - 1
            const nextPart = parts[i + 1]

            const isArrayIndex = !isNaN(Number(nextPart))

            if (isLast) {
                node[part] = value
            } else {
                if (!(part in node)) {
                    node[part] = isArrayIndex ? [] : {}
                }
                node = node[part]
            }
        }
    }

    return result
}

/**
 * data_get
 *
 * Get a value from an object using dot notation.
 * 
 * @param obj 
 * @param path 
 * @param defaultValue 
 * @returns 
 */
export function data_get<
    T extends object,
    P extends DotPath<T> | DotPath<T>[],
    D = undefined
> (obj: T, path: P, defaultValue?: D): T | any {
    if (!obj) return defaultValue
    const parts = Array.isArray(path) ? path : path.split('.')
    let current: any = obj
    for (const part of parts) {
        if (!current || !(part in current)) return defaultValue
        current = current[part]
    }
    return current
}

/**
 * data_set
 *
 * Set a value in an object using dot notation. Mutates the object.
 * 
 * @param obj 
 * @param path 
 * @param value 
 */
export function data_set<
    T extends Record<string, any>,
    P extends string | string[],
    V
> (obj: T, path: P, value: V): asserts obj is T & Record<P extends string ? P : P[0], V> {
    const parts = Array.isArray(path) ? path : path.split('.')
    let current: Record<string, any> = obj
    for (let i = 0; i < parts.length; i++) {
        const part = parts[i]
        if (i === parts.length - 1) {
            current[part] = value
        } else {
            if (!(part in current) || typeof current[part] !== 'object' || current[part] === null) {
                current[part] = {}
            }
            current = current[part]
        }
    }
}

/**
 * data_fill
 *
 * Like data_set, but only sets the value if the key does NOT exist.
 * 
 * @param obj 
 * @param path 
 * @param value 
 */
export function data_fill (
    obj: Record<string, any>,
    path: string | string[],
    value: any
): void {
    if (data_get(obj, path) === undefined) {
        data_set(obj, path, value)
    }
}

/**
 * data_forget
 *
 * Remove a key from an object using dot notation.
 * 
 * @param obj 
 * @param path 
 */
export function data_forget (
    obj: Record<string, any>,
    path: string | string[]
): void {
    const parts = Array.isArray(path) ? path : path.split('.')
    let current = obj
    for (let i = 0; i < parts.length; i++) {
        const part = parts[i]
        if (i === parts.length - 1) {
            delete current[part]
        } else {
            if (!current[part] || typeof current[part] !== 'object') break
            current = current[part]
        }
    }
}

/**
 * Checks if a value is a plain object (not array, function, etc.)
 * 
 * @param value 
 * @param allowArray
 * @returns 
 */
export function isPlainObject<P = any> (value: P, allowArray?: boolean): value is P {
    return (
        value !== null &&
        typeof value === 'object' &&
        (Array.isArray(value) === false || allowArray === true) &&
        Object.prototype.toString.call(value) === '[object Object]'
    )
}

export class Obj {
    /**
     * Check if the value is a non-null object (associative/accessible).
     * 
     * @param value 
     * @returns 
     */
    static accessible (value: unknown): value is Record<string, any> {
        return value !== null && typeof value === 'object'
    }

    /**
     * Add a key-value pair to an object only if the key does not already exist.
     *
     * Returns a new object (does not mutate original).
     * 
     * @param obj 
     * @param key 
     * @param value 
     * @returns 
     */
    static add<T extends Record<string, any>, K extends string, V> (
        obj: T,
        key: K,
        value: V
    ): T & Record<K, V> {
        if (!(key in obj)) {
            return { ...obj, [key]: value }
        }
        return obj as T & Record<K, V>
    }

    /**
     * Deeply merges two or more objects.
     * - Arrays are replaced (not concatenated)
     * - Objects are merged recursively
     * - Non-object values overwrite previous ones
     * 
     * @param objects 
     * @returns 
     */
    static deepMerge<T extends Record<string, any>> (
        ...objects: (Partial<T> | undefined | null)[]
    ): T {
        const result: Record<string, any> = {}

        for (const obj of objects) {
            if (!obj || typeof obj !== 'object') continue

            for (const [key, value] of Object.entries(obj)) {
                const existing = result[key]

                if (isPlainObject(existing) && isPlainObject(value)) {
                    result[key] = Obj.deepMerge(existing, value)
                } else {
                    result[key] = value
                }
            }
        }

        return result as T
    }

    /**
     * Split object into [keys, values]
     * 
     * @param obj 
     * @returns 
     */
    static divide<T extends Record<string, any>> (obj: T): [string[], any[]] {
        const keys = Object.keys(obj)
        const values = Object.values(obj)
        return [keys, values]
    }

    /**
     * Flattens a nested object into a single-level object
     * with dot-separated keys.
     *
     * Example:
     * dot({
     *   user: { name: "John", address: { city: "NY" } },
     *   active: true
     * })
     * 
     * Output:
     * {
     *   "user.name": "John",
     *   "user.address.city": "NY",
     *   "active": true
     * }
     *
     * @template T - The type of the input object
     * @param obj - The nested object to flatten
     * @returns A flattened object with dotted keys and inferred types
     */
    static dot<T extends Record<string, any>> (obj: T): DotFlatten<T> {
        return dot(obj)
    }

    /**
     * Check if a key exists in the object.
     * 
     * @param obj 
     * @param key 
     * @returns 
     */
    static exists<T extends Record<string, any>> (obj: T, key: string | number): boolean {
        return Object.prototype.hasOwnProperty.call(obj, key)
    }

    /**
     * Get a value from an object using dot notation.
     *
     * Example:
     * Obj.get({a:{b:1}}, 'a.b') -> 1
     * 
     * @param obj 
     * @param path 
     * @param defaultValue 
     * @returns 
     */
    static get<
        T extends object,
        P extends DotPath<T>,
        D = undefined
    > (obj: T, path: P, defaultValue?: D): any {
        if (!Obj.accessible(obj)) return defaultValue

        const parts = Array.isArray(path) ? path : path.split('.')
        let current: any = obj

        for (const part of parts) {
            if (!Obj.accessible(current) || !(part in current)) {
                return defaultValue
            }
            current = current[part]
        }
        return current
    }

    /**
     * Check if the object has a given key or keys (dot notation supported).
     * 
     * @param obj 
     * @param keys 
     * @returns 
     */
    static has<T extends object, P extends DotPath<T>> (
        obj: T,
        keys: P | P[]
    ): boolean {
        if (!Obj.accessible(obj)) return false
        const keyArray = Array.isArray(keys) ? keys : [keys]

        return keyArray.every(key => {
            const parts = key.split('.')
            let current: any = obj
            for (const part of parts) {
                if (!Obj.accessible(current) || !(part in current)) return false
                current = current[part]
            }
            return true
        })
    }

    /**
     * Check if an object is associative (has at least one non-numeric key).
     * 
     * @param obj 
     * @returns 
     */
    static isAssoc (obj: unknown): obj is Record<string, any> {
        if (!Obj.accessible(obj)) return false
        return Object.keys(obj).some(k => isNaN(Number(k)))
    }

    /**
     * Checks if a value is a plain object (not array, function, etc.)
     * 
     * @param value 
     * @param allowArray 
     * @returns 
     */
    static isPlainObject<P = any> (value: P, allowArray?: boolean): value is P {
        return isPlainObject(value, allowArray)
    }

    /**
     * Add a prefix to all keys of the object.
     * 
     * @param obj 
     * @param prefix 
     * @returns 
     */
    static prependKeysWith<T extends Record<string, any>> (obj: T, prefix: string): Record<string, any> {
        if (!Obj.accessible(obj)) return {}
        const result: Record<string, any> = {}
        for (const [k, v] of Object.entries(obj)) {
            result[`${prefix}${k}`] = v
        }
        return result
    }

    /**
     * Convert an object into a URL query string.
     *
     * Nested objects/arrays are flattened using bracket notation.
     * 
     * @param obj 
     * @returns 
     */
    static query (obj: Record<string, any>): string {
        const encode = encodeURIComponent
        const parts: string[] = []

        function build (key: string, value: any) {
            if (Array.isArray(value)) {
                value.forEach((v, i) => build(`${key}[${i}]`, v))
            } else if (Obj.accessible(value)) {
                Object.entries(value).forEach(([k, v]) => build(`${key}[${k}]`, v))
            } else {
                parts.push(`${encode(key)}=${encode(value)}`)
            }
        }

        Object.entries(obj).forEach(([k, v]) => build(k, v))
        return parts.join('&')
    }

    /**
     * undot
     *
     * Convert a dot-notated object back into nested structure.
     *
     * Example:
     * undot({ 'a.b': 1, 'c.0': 2 }) -> { a: { b: 1 }, c: [2] }
     * 
     * @param obj 
     * @returns 
     */
    undot (obj: Record<string, any>): Record<string, any> {
        return undot(obj)
    }
}
