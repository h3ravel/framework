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
