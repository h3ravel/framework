/**
 * Splits an array into chunks of a specified size.
 *
 * @template T - Type of elements in the array
 * @param arr - The input array
 * @param size - Size of each chunk (default: 2)
 * @returns An array of chunks (arrays)
 */
export const chunk = <T> (arr: T[], size: number = 2): T[][] => {
    if (size <= 0) throw new Error('Chunk size must be greater than 0')

    const chunks: T[][] = []

    for (let i = 0; i < arr.length; i += size) {
        chunks.push(arr.slice(i, i + size))
    }

    return chunks
}

/**
 * Collapse an array of arrays into a single array.
 */
export const collapse = <T> (arr: (T | T[])[]): T[] => {
    const result: T[] = []
    for (const item of arr) {
        if (Array.isArray(item)) result.push(...item)
        else result.push(item)
    }
    return result
}

/**
 * Alternates between two arrays, creating a zipped result.
 */
export const alternate = <T> (a: T[], b: T[]): T[] => {
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
 */
export const combine = (...arr: number[][]): number[] => {
    const maxLength = Math.max(...arr.map(a => a.length))
    const result: number[] = new Array(maxLength).fill(0)
    for (let i = 0; i < maxLength; i++) {
        for (const array of arr) result[i] += (array[i] || 0)
    }
    return result
}

/** Find the value associated with a given key. */
export const find = <T> (key: T, arr: T[]): T | null => arr.find(item => item === key) || null

/** Returns a new array without the given indices. */
export const forget = <T> (arr: T[], keys: number[]): T[] => arr.filter((_, i) => !keys.includes(i))

/** Remove the first element and return tuple [el, rest]. */
export const first = <T> (arr: T[]): [T, T[]] => {
    if (!arr.length) throw new Error('Cannot shift from empty array')
    return [arr[0], arr.slice(1)]
}

/** Remove the last element and return tuple [el, rest]. */
export const last = <T> (arr: T[]): [T, T[]] => {
    if (!arr.length) throw new Error('Cannot pop from empty array')
    const lastItem = arr[arr.length - 1]
    return [lastItem, arr.slice(0, -1)]
}

/** Check if array is empty. */
export const isEmpty = <T> (arr: T[]): boolean => {
    if (arr.length === 0) return true
    else return false
}

/** Check if array is empty. */
export const isNotEmpty = <T> (arr: T[]): boolean => arr.length > 0

/** Pop the element off the end of array. */
export const pop = <T> (arr: T[]): T[] => arr.slice(0, -1)

/** Add elements to the beginning of array. */
export const prepend = <T> (arr: T[], ...elements: T[]): T[] => [...elements, ...arr]

/** Take first n elements of array. */
export const take = <T> (amount: number, arr: T[]): T[] => arr.slice(0, Math.max(0, amount))

/** Create a new array in reverse order. */
export const reverse = <T> (arr: T[]): T[] => [...arr].reverse()

/** Alias for first element removal. */
export const shift = first

/**
 * Generates an array of sequential numbers.
 *
 * @param size - Number of elements in the range
 * @param startAt - Starting number (default: 0)
 * @returns An array of numbers from startAt to startAt + size - 1
 */
export const range = (size: number, startAt: number = 0): number[] => {
    if (size <= 0 || !Number.isFinite(size)) return []
    return Array.from({ length: size }, (_, i) => startAt + i)
}

/** Flatten multi-dimensional arrays into single level. */
export const flatten = <T> (arr: T[]): T[] => {
    const result: T[] = []
    const recurse = (input: any[]): void => {
        for (const item of input) Array.isArray(item) ? recurse(item) : result.push(item)
    }
    recurse(arr as any[])
    return result
}
