import { DotFlatten, DotNestedKeys, DotNestedValue, KeysToSnakeCase } from "../Contracts/ObjContract"

/**
 * Flattens a nested object into a single-level object
 * with dot-separated keys.
 *
 * Example:
 * doter({
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
    callback: (entry: [keyof T & string, T[keyof T]]) => [string, R]
): Record<string, R> => {
    return Object.fromEntries(
        Object.entries(obj).map(([key, value]) =>
            callback([key as keyof T & string, value as T[keyof T]])
        )
    ) as Record<string, R>
}


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
