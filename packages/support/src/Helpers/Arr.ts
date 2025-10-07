/**
 * Arr — Laravel-like array helpers for JavaScript (first batch of 10).
 *
 * Export style: ESM
 * Methods: static
 *
 * Notes:
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
     * collapse
     *
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
     * crossJoin
     *
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
     * divide
     *
     * Split an array (or object) into two arrays: [keys, values].
     *
     * For arrays, keys are numeric indices. For objects, keys are property names.
     *
     * Example:
     * Arr.divide(['a','b']) -> [[0,1], ['a','b']]
     * Arr.divide({x:1,y:2}) -> [['x','y'], [1,2]]
     */
    static divide<A> (input: A[]) {
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
     * dot
     *
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
     * except
     *
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
     * first
     *
     * Return the first element of an array that satisfies the predicate,
     * or the first element if no predicate is provided, otherwise the defaultValue.
     *
     * Predicate can be a function or a value to match (strict equality).
     */
    static first<A, X> (
        array: A[],
        predicate: ((arg: A) => true) | undefined = undefined,
        defaultValue: X | undefined = undefined
    ): A | undefined {
        if (!Array.isArray(array) || array.length === 0) return defaultValue as A
        if (predicate === undefined) return array[0]

        if (typeof predicate === 'function') {
            for (const item of array) {
                if (predicate(item)) return item
            }
            return defaultValue as A
        }

        // value match
        for (const item of array) {
            if (item === predicate) return item
        }
        return defaultValue as A
    }

    /**
     * flatten
     *
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
     * forget
     *
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
     * hasAny
     *
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
     * isList
     *
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
     * join
     *
     * Join array elements into a string using the given separator.
     *
     * Example:
     * Arr.join([1,2,3], '-') -> '1-2-3'
     */
    static join (array: any[], separator: string = ','): string {
        return Array.isArray(array) ? array.join(separator) : ''
    }

    /**
     * keyBy
     *
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
     * last
     *
     * Get the last element of an array, optionally matching a predicate.
     */
    static last<T> (
        array: T[],
        predicate?: ((item: T) => boolean) | T,
        defaultValue?: T
    ): T | undefined {
        if (!Array.isArray(array) || array.length === 0) return defaultValue
        if (!predicate) return array[array.length - 1]

        if (typeof predicate === 'function') {
            for (let i = array.length - 1; i >= 0; i--) {
                if ((predicate as (item: T) => boolean)(array[i])) return array[i]
            }
        } else {
            for (let i = array.length - 1; i >= 0; i--) {
                if (array[i] === predicate) return array[i]
            }
        }
        return defaultValue
    }

    /**
     * map
     *
     * Transform each element in an array using a callback.
     */
    static map<T, U> (array: T[], callback: (item: T, index: number) => U): U[] {
        return Array.isArray(array) ? array.map(callback) : []
    }

    /**
     * mapWithKeys
     *
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
     * only
     *
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
     * pluck
     *
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
     * prepend
     *
     * Add a value to the beginning of an array and return a new array.
     */
    static prepend<T> (array: T[], value: T): T[] {
        return [value, ...(Array.isArray(array) ? array : [])]
    }

    /**
     * pull
     *
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
     * random
     *
     * Pick one or more random elements from an array.
     */
    static random<T> (array: T[], count: number = 1): T | T[] | undefined {
        if (!Array.isArray(array) || array.length === 0) return undefined
        const shuffled = Arr.shuffle(array)
        if (count === 1) return shuffled[0]
        return shuffled.slice(0, count)
    }


    /**
     * shuffle
     *
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
     * sort
     *
     * Sort an array ascending using optional comparator.
     */
    static sort<T> (array: T[], comparator?: (a: T, b: T) => number): T[] {
        if (!Array.isArray(array)) return []
        return array.slice().sort(comparator)
    }

    /**
     * sortDesc
     *
     * Sort an array descending using optional comparator.
     */
    static sortDesc<T> (array: T[], comparator?: (a: T, b: T) => number): T[] {
        return Arr.sort(array, comparator ? (a, b) => comparator(b, a) : undefined)
    }

    /**
     * sortRecursive
     *
     * Recursively sort arrays inside an array.
     */
    static sortRecursive<T> (array: T[]): T[] {
        if (!Array.isArray(array)) return []
        return array.map(item =>
            Array.isArray(item) ? Arr.sortRecursive(item) : item
        ).sort() as T[]
    }

    /**
     * sortRecursiveDesc
     *
     * Recursively sort arrays inside an array descending.
     */
    static sortRecursiveDesc<T> (array: T[]): T[] {
        if (!Array.isArray(array)) return []
        return array.map(item =>
            Array.isArray(item) ? Arr.sortRecursiveDesc(item) : item
        ).sort().reverse() as T[]
    }

    /**
     * take
     *
     * Return the first `count` elements of an array.
     */
    static take<T> (array: T[], count: number): T[] {
        if (!Array.isArray(array)) return []
        return array.slice(0, count)
    }

    /**
     * where
     *
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
     * whereNotNull
     *
     * Filter an array of objects, keeping elements where the given key is not null/undefined.
     */
    static whereNotNull<T> (
        array: T[],
        key: keyof T
    ): T[] {
        if (!Array.isArray(array)) return []
        return array.filter(item => (item[key] !== null && item[key] !== undefined))
    }

    /**
     * wrap
     *
     * Ensure the input is wrapped in an array. 
     * Non-array values become [value]; null/undefined becomes [].
     */
    static wrap<T> (value: T | T[] | null | undefined): T[] {
        if (value === null || value === undefined) return []
        return Array.isArray(value) ? value : [value]
    }

    /**
     * head
     *
     * Return the first element of an array, undefined if empty.
     */
    static head<T> (array: T[]): T | undefined {
        return Array.isArray(array) && array.length ? array[0] : undefined
    }
}
