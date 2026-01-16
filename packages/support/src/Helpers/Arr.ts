
import { Arrayable, Jsonable, JsonSerializable } from '../Contracts/TypeCast'
import { InvalidArgumentException } from '../Exceptions/InvalidArgumentException'
import { data_get } from './Obj'

/**
 * Arr — Laravel-like array helpers for JavaScript.
 *
 * - Methods aim for clear, predictable JS behavior.
 * - Inputs are validated where useful; functions try not to mutate arguments.
 */

export class Arr {
    /**
     * Helper: is a value an object (but not null).
     */
    static _isObject (value: any) {
        return value !== null && typeof value === 'object' && !Array.isArray(value)
    }

    /**
     * Helper: deep clone for safety (simple).
     * Uses JSON methods — good for typical data shapes (no functions, Dates, Maps).
     */
    static _clone<A = any> (value: A): A {
        try {
            return JSON.parse(JSON.stringify(value))
        } catch {
            return value
        }
    }

    /**
     * Retrieve a value using dot notation
     * Throws if value is not an array
     */
    static array (obj: any, path: string, defaultValue?: number): any[] {
        const val = data_get(obj, path, defaultValue)
        if (!Array.isArray(val)) {
            throw new InvalidArgumentException(`Value at "${path}" is not an array.`)
        }
        return val
    }

    /**
     * Retrieve a value using dot notation
     * Throws if value is not a boolean
     */
    static boolean (obj: any, path: string, defaultValue?: boolean): boolean {
        const val = data_get(obj, path, defaultValue)
        if (typeof val !== 'boolean') {
            throw new InvalidArgumentException(`Value at "${path}" is not a boolean.`)
        }
        return val
    }

    /**
     * Flatten an array of arrays by one level.
     *
     * Example:
     * Arr.collapse([[1,2], [3], 4]) -> [1,2,3,4]
     */
    static collapse<X> (array: X[][] | X[]) {
        if (!Array.isArray(array)) return []
        const result: X[] = []
        for (const item of array) {
            if (Array.isArray(item)) {
                result.push(...item)
            } else {
                result.push(item)
            }
        }
        return result
    }

    /**
     * Cartesian product of arrays.
     *
     * Example:
     * Arr.crossJoin([1,2], ['a','b']) -> [[1,'a'], [1,'b'], [2,'a'], [2,'b']]
     *
     * Accepts any number of array arguments (or single array-of-arrays).
     */
    static crossJoin<A> (...arrays: A[][]) {
        let inputs: A[] | A[][] = arrays
        if (arrays.length === 1 && Array.isArray(arrays[0]) && arrays[0].some(Array.isArray)) {
            inputs = arrays[0]
        }

        // validate
        inputs = inputs.map(a => (Array.isArray(a) ? a : [a]))

        // start with an empty product
        let product: A[][] = [[]]
        for (const arr of inputs) {
            const next = []
            for (const prefix of product) {
                for (const value of arr) {
                    next.push([...prefix, value])
                }
            }
            product = next
        }
        return product
    }

    /**
     * Split an array (or object) into two arrays: [keys, values].
     *
     * For arrays, keys are numeric indices. For objects, keys are property names.
     *
     * Example:
     * Arr.divide(['a','b']) -> [[0,1], ['a','b']]
     * Arr.divide({x:1,y:2}) -> [['x','y'], [1,2]]
     */
    static divide<A> (input: A[] | Record<string, A>) {
        if (Array.isArray(input)) {
            const keys = input.map((_, i) => i)
            const values = input.slice()
            return [keys, values]
        }
        if (Arr._isObject(input)) {
            const keys = Object.keys(input)
            const values = keys.map(k => input[k])
            return [keys, values]
        }
        return [[], []]
    }

    /**
     * Flatten a nested array/object structure into a single-level object
     * with dot-notated keys.
     *
     * Example:
     * Arr.dot({ a: { b: 1 }, c: [2,3] }) -> { 'a.b': 1, 'c.0': 2, 'c.1': 3 }
     *
     * Works for arrays and plain objects.
     */
    static dot<A> (input: A[] | Record<string, A>, prefix = ''): Record<string, A> {
        const result: Record<string, A | Record<string, A>> = {}

        const recurse = (val: A[] | Record<string, A>, path: string) => {
            if (Array.isArray(val)) {
                for (let i = 0; i < val.length; i++) {
                    recurse(<never>val[i], path ? `${path}.${i}` : String(i))
                }
            } else if (Arr._isObject(val)) {
                for (const [k, v] of Object.entries(val)) {
                    const next = path ? `${path}.${k}` : k
                    recurse(<never>v, next)
                }
            } else {
                result[path] = val
            }
        }

        if (Array.isArray(input) || Arr._isObject(input)) {
            recurse(input, prefix)
        }
        return result as Record<string, A>
    }

    /**
     * Checks if all elements satisfy the predicate
     */
    static every<T> (array: T[], predicate: (item: T) => boolean): boolean {
        return array.every(predicate)
    }

    /**
     * Remove items by keys/indices from an array or properties from an object.
     *
     * For arrays: keys are numeric indices (single number or array of numbers).
     *
     * Returns a shallow-copied result (does not mutate input).
     *
     * Example:
     * Arr.except([10,20,30], [1]) -> [10,30]
     */
    static except<A extends any[] | Record<string, any>, X> (input: A, keys: X[]): A {
        const keySet = new Set(Array.isArray(keys) ? keys : [keys])

        if (Array.isArray(input)) {
            return input.filter((_, idx) => !keySet.has(<never>idx)) as never
        }
        if (Arr._isObject(input)) {
            const out: Record<string, A> = {}
            for (const [k, v] of Object.entries(input)) {
                if (!keySet.has(<never>k)) out[k] = v
            }
            return out as never
        }
        return input as never
    }

    /**
     * Return the first element of an array that satisfies the predicate,
     * or the first element if no predicate is provided, otherwise the defaultValue.
     *
     * Predicate can be true (boolean), a function or a value to match (strict equality).
     * 
     * When predicate is true (boolean), the first element will be removed and a tuple will be returned [el, rest].
     * 
     * @param array 
     * @param predicate 
     * @param defaultValue 
     * 
     * @returns 
     */
    static first<A, P extends (((arg: A) => true) | true)> (
        array: A[],
        predicate?: P | undefined,
        defaultValue?: A | undefined
    ): P extends true ? [A, A[]] : A | undefined {
        if (predicate === true) {
            if (!array.length) throw new Error('Cannot shift from empty array')
            return [array[0], array.slice(1)] as never
        }

        if (!Array.isArray(array) || array.length === 0) return defaultValue as never
        if (predicate === undefined) return array[0] as never

        if (typeof predicate === 'function') {
            for (const item of array) {
                if (predicate(item)) return item as never
            }
            return defaultValue as never
        }

        // value match
        for (const item of array) {
            if (typeof predicate !== 'boolean' && item === <never>predicate) return item as never
        }
        return defaultValue as never
    }

    /**
     * Recursively flatten an array up to `depth` levels (default: Infinity).
     *
     * Example:
     * Arr.flatten([1, [2, [3]]], 1) -> [1,2,[3]]
     */
    static flatten<A> (array: A[], depth = Infinity): A[] {
        if (!Array.isArray(array)) return []
        if (depth < 1) return array.slice()

        const result = []
        for (const item of array) {
            if (Array.isArray(item) && depth > 0) {
                result.push(...Arr.flatten(item, depth - 1))
            } else {
                result.push(item)
            }
        }
        return result
    }

    /**
     * Retrieve a value from an array/object using dot notation
     * Throws if value is not a float
     */
    static float (obj: any, path: string, defaultValue?: number): number {
        const val = data_get(obj, path, defaultValue)
        if (typeof val !== 'number' || Number.isNaN(val)) {
            throw new InvalidArgumentException(`Value at "${path}" is not a float.`)
        }
        return val
    }

    /**
     * Remove element(s) by index or dot-notated path from an array/object.
     *
     * For arrays: accepts numeric index or array of indices. Returns a new array.
     *
     * For objects: supports dot notation to remove nested keys.
     *
     * Example:
     * Arr.forget([1,2,3], 1) -> [1,3]
     * Arr.forget({a:{b:1}}, 'a.b') -> { a: {} }
     */
    static forget<A extends any[] | Record<string, any>> (input: A, keys: any): A {
        // arrays
        if (Array.isArray(input)) {
            const removeSet = new Set(Array.isArray(keys) ? keys : [keys])
            return input.filter((_, i) => !removeSet.has(i)) as A
        }

        // objects with dot support
        if (Arr._isObject(input)) {
            const out = Arr._clone(input)
            const keyList = Array.isArray(keys) ? keys : [keys]

            for (const key of keyList) {
                const parts = String(key).split('.')
                let node = out
                for (let i = 0; i < parts.length; i++) {
                    const part = parts[i]
                    if (i === parts.length - 1) {
                        if (node && Object.prototype.hasOwnProperty.call(node, part)) {
                            delete node[<never>part]
                        }
                    } else {
                        if (!Arr._isObject(node[<never>part])) break
                        node = node[<never>part]
                    }
                }
            }
            return out
        }

        return input
    }

    /**
     * Converts various input types into a plain array
     * Supports Arrays, Objects, Iterables, Map, WeakMap, and custom toArray/toJSON/jsonSerialize methods
     */
    static from<T> (
        value: T | Iterable<T> | Arrayable | Jsonable | JsonSerializable | null | undefined
    ): any[] {
        if (value == null) return []

        // Array
        if (Array.isArray(value)) return value

        // Iterable (generators, sets, maps)
        if (Symbol.iterator in Object(value)) return [...(value as Iterable<any>)]

        // Arrayable
        if ((value as Arrayable).toArray) return (value as Arrayable).toArray()

        // Jsonable
        if ((value as Jsonable).toJSON) return (value as Jsonable).toJSON()

        // JsonSerializable
        if ((value as JsonSerializable).jsonSerialize) return (value as JsonSerializable).jsonSerialize()

        // WeakMap / Map / Object fallback
        if (value instanceof Map) return Array.from(value.entries())
        if (value instanceof WeakMap) return [] // can't enumerate WeakMap keys
        if (typeof value === 'object') return Object.values(value)

        // Fallback for primitives
        return [value]
    }

    /**
     * Checks if an object has all the specified keys
     */
    static hasAll<T extends object> (obj: T, keys: (keyof T)[]): boolean {
        return keys.every(k => k in obj)
    }

    /**
     * For arrays: check if the array contains any of the provided values.
     *
     * values can be single value or array of values.
     *
     * Example:
     * Arr.hasAny([1,2,3], [4,2]) -> true
     */
    static hasAny<A> (array: A[], values: A[] | A) {
        if (!Array.isArray(array)) return false
        const vs = Array.isArray(values) ? values : [values]
        const set = new Set(array)
        for (const v of vs) {
            if (set.has(v)) return true
        }
        return false
    }

    /**
     * Retrieve a value using dot notation
     * Throws if value is not an integer
     */
    static integer (obj: any, path: string, defaultValue?: number): number {
        const val = data_get(obj, path, defaultValue)
        if (!Number.isInteger(val)) {
            throw new InvalidArgumentException(`Value at "${path}" is not an integer.`)
        }
        return val
    }

    /**
     * Determine if the input is a "list-like" array: an Array with
     * contiguous numeric indices starting at 0 (no gaps).
     *
     * Example:
     * Arr.isList([1,2,3]) -> true
     * const a = []; a[2] = 5; Arr.isList(a) -> false
     */
    static isList<A> (value: A[]) {
        if (!Array.isArray(value)) return false
        for (let i = 0; i < value.length; i++) {
            if (!(i in value)) return false // holes
        }
        return true
    }

    /**
     * Join array elements into a string using the given separator.
     *
     * Example:
     * Arr.join([1,2,3], '-') -> '1-2-3'
     */
    static join (array: any[], separator: string = ','): string {
        return Array.isArray(array) ? array.join(separator) : ''
    }

    /**
     * Create an object indexed by a key or callback function.
     *
     * Example:
     * Arr.keyBy([{id:1},{id:2}], 'id') -> { '1': {id:1}, '2': {id:2} }
     */
    static keyBy<T> (
        array: T[],
        key: keyof T | ((item: T) => string | number)
    ): Record<string, T> {
        const result: Record<string, T> = {}
        if (!Array.isArray(array)) return result

        for (const item of array) {
            let k: string | number
            if (typeof key === 'function') {
                k = key(item)
            } else {
                k = String(item[key])
            }
            result[k] = item
        }
        return result
    }

    /**
     * Get the last element of an array, optionally matching a predicate,
     * or the last element if no predicate is provided, otherwise the defaultValue.
     *
     * Predicate can be a true (boolean), a function or a value to match (strict equality).
     * 
     * When predicate is true (boolean), the last element will be removed and a tuple will be returned [el, rest].
     * 
     * @param array 
     * @param predicate 
     * @param defaultValue 
     * 
     * @returns 
     */
    static last<T, P extends ((item: T) => boolean) | true> (
        array: T[],
        predicate?: P | T,
        defaultValue?: T
    ): P extends true ? [T, T[]] : T | undefined {

        if (predicate === true) {
            if (!array.length) throw new Error('Cannot pop from empty array')
            const lastItem = array[array.length - 1]
            return [lastItem, array.slice(0, -1)] as never
        }

        if (!Array.isArray(array) || array.length === 0) return defaultValue as never
        if (!predicate) return array[array.length - 1] as never

        if (typeof predicate === 'function') {
            for (let i = array.length - 1; i >= 0; i--) {
                if ((predicate as (item: T) => boolean)(array[i])) return array[i] as never
            }
        } else {
            for (let i = array.length - 1; i >= 0; i--) {
                if (array[i] === predicate) return array[i] as never
            }
        }

        return defaultValue as never
    }

    /**
     * Transform each element in an array using a callback.
     */
    static map<T, U> (array: T[], callback: (item: T, index: number) => U): U[] {
        return Array.isArray(array) ? array.map(callback) : []
    }

    /**
     * Maps a multi-dimensional array with a spread callback
     */
    static mapSpread<T extends any[], U> (array: T[], callback: (...items: T) => U): U[] {
        return array.map(item => callback(...(Array.isArray(item) ? item : [item]) as any))
    }

    /**
     * Map each element to a key-value pair.
     *
     * Example:
     * Arr.mapWithKeys([{id:1, name:'A'}], x => [x.id, x.name])
     * -> { '1': 'A' }
     */
    static mapWithKeys<T, K extends string | number, V> (
        array: T[],
        callback: (item: T, index: number) => [K, V]
    ): Record<string, V> {
        const result: Record<string, V> = {}
        if (!Array.isArray(array)) return result

        array.forEach((item, idx) => {
            const [k, v] = callback(item, idx)
            result[String(k)] = v
        })
        return result
    }

    /**
     * Return only elements at the given indices.
     *
     * Example:
     * Arr.only([10,20,30], [0,2]) -> [10,30]
     */
    static only<T> (array: T[], keys: number | number[]): T[] {
        if (!Array.isArray(array)) return []
        const keyArray = Array.isArray(keys) ? keys : [keys]
        return array.filter((_, idx) => keyArray.includes(idx))
    }

    /**
     * Split an array into two arrays based on a predicate
     */
    static partition<T> (array: T[], predicate: (item: T) => boolean): [T[], T[]] {
        const truthy: T[] = []
        const falsy: T[] = []
        array.forEach(item => (predicate(item) ? truthy : falsy).push(item))
        return [truthy, falsy]
    }

    /**
     * Extract a property from each element in an array of objects.
     *
     * Example:
     * Arr.pluck([{name:'A'},{name:'B'}], 'name') -> ['A','B']
     */
    static pluck<T, K extends keyof T> (array: T[], key: K): T[K][] {
        if (!Array.isArray(array)) return []
        return array.map(item => item[key])
    }

    /**
     * Add elements to the beginning of an array and return a new array.
     * 
     * @param array 
     * @param value 
     * @returns 
     */
    static prepend<T> (array: T[], ...value: T[]): T[] {
        return [...value, ...(Array.isArray(array) ? array : [])]
    }

    /**
     * Remove a value from an array by index and return it.
     * Returns a tuple: [newArray, removedValue]
     */
    static pull<T> (array: T[], key: number): [T[], T | undefined] {
        if (!Array.isArray(array) || key < 0 || key >= array.length) return [array, undefined]
        const copy = array.slice()
        const [removed] = copy.splice(key, 1)
        return [copy, removed]
    }

    /**
     * Append values to an array (mutable)
     */
    static push<T> (array: T[], ...values: T[]): T[] {
        array.push(...values)
        return array
    }

    /**
     * Pick one or more random elements from an array.
     */
    static random<T> (array: T[], count: number = 1): T | T[] | undefined {
        if (!Array.isArray(array) || array.length === 0) return undefined
        const shuffled = Arr.shuffle(array)
        if (count === 1) return shuffled[0]
        return shuffled.slice(0, count)
    }

    /**
     * Returns array elements that do NOT satisfy the predicate
     */
    static reject<T> (array: T[], predicate: (item: T) => boolean): T[] {
        return array.filter(item => !predicate(item))
    }

    /**
     * Pick keys from an array of objects or an object
     */
    static select<T extends object, K extends keyof T> (obj: T, keys: K[]): Pick<T, K> {
        const result = {} as Pick<T, K>
        keys.forEach(k => {
            if (k in obj) result[k] = obj[k]
        })
        return result
    }


    /**
     * Returns the only element that passes a callback, throws if none or multiple
     */
    static sole<T> (array: T[], predicate: (item: T) => boolean): T {
        const filtered = array.filter(predicate)
        if (filtered.length === 0) throw new InvalidArgumentException('No element satisfies the condition.')
        if (filtered.length > 1) throw new InvalidArgumentException('Multiple elements satisfy the condition.')
        return filtered[0]
    }

    /**
     * Checks if at least one element satisfies the predicate
     */
    static some<T> (array: T[], predicate: (item: T) => boolean): boolean {
        return array.some(predicate)
    }

    /**
     * Randomly shuffle an array and return a new array.
     */
    static shuffle<T> (array: T[]): T[] {
        if (!Array.isArray(array)) return []
        const copy = array.slice()
        for (let i = copy.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [copy[i], copy[j]] = [copy[j], copy[i]]
        }
        return copy
    }


    /**
     * Sort an array ascending using optional comparator.
     */
    static sort<T> (array: T[], comparator?: (a: T, b: T) => number): T[] {
        if (!Array.isArray(array)) return []
        return array.slice().sort(comparator)
    }

    /**
     * Sort an array descending using optional comparator.
     */
    static sortDesc<T> (array: T[], comparator?: (a: T, b: T) => number): T[] {
        return Arr.sort(array, comparator ? (a, b) => comparator(b, a) : undefined)
    }

    /**
     * Recursively sort arrays inside an array.
     */
    static sortRecursive<T> (array: T[]): T[] {
        if (!Array.isArray(array)) return []
        return array.map(item =>
            Array.isArray(item) ? Arr.sortRecursive(item) : item
        ).sort() as T[]
    }

    /**
     * Recursively sort arrays inside an array descending.
     */
    static sortRecursiveDesc<T> (array: T[]): T[] {
        if (!Array.isArray(array)) return []
        return array.map(item =>
            Array.isArray(item) ? Arr.sortRecursiveDesc(item) : item
        ).sort().reverse() as T[]
    }

    /**
     * Retrieve a value using dot notation
     * Throws if value is not a string
     */
    static string (obj: any, path: string, defaultValue?: string): string {
        const val = data_get(obj, path, defaultValue)
        if (typeof val !== 'string') {
            throw new InvalidArgumentException(`Value at "${path}" is not a string.`)
        }
        return val
    }

    /**
     * Return the first N elements of an array.
     * 
     * @param array 
     * @param count 
     * @returns 
     */
    static take<T> (array: T[], count: number): T[] {
        if (!Array.isArray(array)) return []
        return array.slice(0, count)
    }

    /**
     * Filter an array based on a predicate function or key-value match.
     */
    static where<T> (
        array: T[],
        predicate: ((item: T) => boolean) | Partial<T>
    ): T[] {
        if (!Array.isArray(array)) return []
        if (typeof predicate === 'function') {
            return array.filter(predicate)
        }
        return array.filter(item =>
            Object.entries(predicate).every(([k, v]) => (item as any)[k] === v)
        )
    }

    /**
     * Filter an array of objects, keeping elements where the given key is not null/undefined.
     */
    static whereNotNull<T> (
        array: T[],
        key?: keyof T
    ): T[] {
        if (!Array.isArray(array))
            return []

        if (!key)
            return array.filter((item) => item !== null && item !== undefined)

        return array.filter(item => (item[key] !== null && item[key] !== undefined))
    }

    /**
     * If the given value is not an array and not null, wrap it in one.
     * 
     * Non-array values become [value]; null/undefined becomes [].
     * 
     * @param value 
     * @returns 
     */
    static wrap<T = any> (value: T | T[] | null | undefined): T[] {
        if (value === null || value === undefined) return []
        return Array.isArray(value) ? value : [value]
    }

    /**
     * Return the first element of an array, undefined if empty.
     */
    static head<T> (array: T[]): T | undefined {
        return Array.isArray(array) && array.length ? array[0] : undefined
    }

    // ============= Additional Non Cannon Arr methods

    /**
     * Splits an array into chunks of a specified size.
     *
     * @template T - Type of elements in the array
     * @param arr - The input array
     * @param size - Size of each chunk (default: 2)
     * @returns An array of chunks (arrays)
     */
    static chunk = <T> (arr: T[], size: number = 2): T[][] => {
        if (size <= 0) throw new Error('Chunk size must be greater than 0')

        const chunks: T[][] = []

        for (let i = 0; i < arr.length; i += size) {
            chunks.push(arr.slice(i, i + size))
        }

        return chunks
    }

    /**
     * Alternates between two arrays, creating a zipped result.
     * 
     * @param a 
     * @param b 
     * @returns 
     */
    static alternate<T> (a: T[], b: T[]): T[] {
        const result: T[] = []
        const max = Math.max(a.length, b.length)
        for (let i = 0; i < max; i++) {
            if (i < a.length) result.push(a[i])
            if (i < b.length) result.push(b[i])
        }
        return result
    }

    /**
     * Combine arrays and sum their values element by element.
     * 
     * @param arr 
     * @returns 
     */
    static combine (...arr: number[][]): number[] {
        const maxLength = Math.max(...arr.map(a => a.length))
        const result: number[] = new Array(maxLength).fill(0)
        for (let i = 0; i < maxLength; i++) {
            for (const array of arr) result[i] += (array[i] || 0)
        }
        return result
    }

    /** 
     * Find the value associated with a given key. 
     * 
     * @param key 
     * @param arr 
     * @returns 
     */
    static find<T> (key: T, arr: T[]): T | null {
        return arr.find(item => item === key) || null
    }

    /**
     * Check if array is empty.
     * 
     * @param arr 
     * @returns 
     */
    static isEmpty<T> (arr: T[]): boolean {
        if (arr.length === 0) return true
        else return false
    }

    /**
     * Check if array is empty. 
     * 
     * @param arr 
     * @returns 
     */
    static isNotEmpty<T> (arr: T[]): boolean {
        return arr.length > 0
    }

    /**
     * Pop the element off the end of array.
     * 
     * @param arr 
     * @returns 
     */
    static pop<T> (arr: T[]): T[] {
        return arr.slice(0, -1)
    }

    /**
     * Create a new array in reverse order. 
     * 
     * @param arr 
     * @returns 
     */
    static reverse<T> (arr: T[]): T[] {
        return [...arr].reverse()
    }

    /**
     * Return the first element of an array that satisfies the predicate,
     * or the first element if no predicate is provided, otherwise the defaultValue.
     *
     * Predicate can be true (boolean), a function or a value to match (strict equality).
     * 
     * When predicate is true (boolean), the first element will be removed and a tuple will be returned [el, rest].
     * 
     * @param array 
     * @param predicate 
     * @param defaultValue 
     * 
     * @alias Arr.first()
     * @returns 
     */
    static shift<A, P extends (((arg: A) => true) | true)> (
        array: A[],
        predicate?: P | undefined,
        defaultValue?: A | undefined
    ): P extends true ? [A, A[]] : A | undefined {
        return Arr.first(array, predicate, defaultValue)
    }

    /**
     * Generates an array of sequential numbers.
     *
     * @param size - Number of elements in the range
     * @param startAt - Starting number (default: 0)
     * @returns An array of numbers from startAt to startAt + size - 1
     */
    static range (size: number, startAt: number = 0): number[] {
        if (size <= 0 || !Number.isFinite(size)) return []
        return Array.from({ length: size }, (_, i) => startAt + i)
    }

    /**
     * Filters an array and returns only unique values
     * 
     * @param items 
     * @returns 
     */
    static unique<T = any> (items: T[]) {
        return items.filter((value, index, self) => self.indexOf(value) === index)
    }
}
