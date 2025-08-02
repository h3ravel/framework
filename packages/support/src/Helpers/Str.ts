import { dot } from "./Obj"

/**
 * Get the portion of the string after the first occurrence of the given value.
 * 
 * @param value 
 * @param search 
 * @returns 
 */
export const after = (value: string, search: string): string => {
    if (!search) return value
    const index = value.indexOf(search)
    return index !== -1 ? value.slice(index + search.length) : value
}

/**
 * Get the portion of the string after the last occurrence of the given value.
 * 
 * @param value 
 * @param search 
 * @returns 
 */
export const afterLast = (value: string, search: string): string => {
    if (!search) return value
    const lastIndex = value.lastIndexOf(search)
    return lastIndex !== -1 ? value.slice(lastIndex + search.length) : value
}

/**
 * Get the portion of the string before the first occurrence of the given value.
 * 
 * @param value 
 * @param search 
 * @returns 
 */
export const before = (value: string, search: string): string => {
    if (!search) return value
    const index = value.indexOf(search)
    return index !== -1 ? value.slice(0, index) : value
}

/**
 * Get the portion of the string before the last occurrence of the given value.
 * 
 * @param value 
 * @param search 
 * @returns 
 */
export const beforeLast = (value: string, search: string): string => {
    if (!search) return value
    const lastIndex = value.lastIndexOf(search)
    return lastIndex !== -1 ? value.slice(0, lastIndex) : value
}

/**
 * Capitalizes the first character of a string.
 *
 * @param str - The input string
 * @returns The string with the first character capitalized
 */
export function capitalize (str: string): string {
    if (!str) return '' // Handle empty or undefined strings safely
    return str[0].toUpperCase() + str.slice(1)
}


/**
 * Returns the pluralized form of a word based on the given number.
 *
 * @param word - The word to pluralize
 * @param count - The number determining pluralization
 * @returns Singular if count === 1, otherwise plural form
 */
export const pluralize = (word: string, count: number): string => {
    // If count is exactly 1 → singular
    if (count === 1) return word

    // Irregular plurals map
    const irregularPlurals: Record<string, string> = {
        foot: 'feet',
        child: 'children',
        mouse: 'mice',
        goose: 'geese',
        person: 'people',
        man: 'men',
        woman: 'women',
    }

    // Handle irregular cases first
    if (word in irregularPlurals) {
        return irregularPlurals[word]
    }

    // If word ends with consonant + "y" → replace "y" with "ies"
    if (
        word.endsWith('y') &&
        !['a', 'e', 'i', 'o', 'u'].includes(word[word.length - 2]?.toLowerCase() ?? '')
    ) {
        return word.slice(0, -1) + 'ies'
    }

    // If word ends in "s", "ss", "sh", "ch", "x", or "z" → add "es"
    if (/(s|ss|sh|ch|x|z)$/i.test(word)) {
        return word + 'es'
    }

    // Default: just add "s"
    return word + 's'
}

/**
 * Converts a plural English word into its singular form.
 *
 * @param word - The word to singularize
 * @returns The singular form of the word
 */
export const singularize = (word: string): string => {
    // Irregular plurals map (reverse of pluralize)
    const irregulars: Record<string, string> = {
        feet: 'foot',
        children: 'child',
        mice: 'mouse',
        geese: 'goose',
        people: 'person',
        men: 'man',
        women: 'woman',
    }

    // Handle irregular cases
    if (word in irregulars) return irregulars[word]

    // Words ending in "ies" → change to "y" (e.g., "bodies" → "body")
    if (/ies$/i.test(word) && word.length > 3) {
        return word.replace(/ies$/i, 'y')
    }

    // Words ending in "es" after certain consonants → remove "es"
    if (/(ches|shes|sses|xes|zes)$/i.test(word)) {
        return word.replace(/es$/i, '')
    }

    // Generic case: remove trailing "s"
    if (/s$/i.test(word) && word.length > 1) {
        return word.replace(/s$/i, '')
    }

    return word
}

/**
 * Converts a string into a slug format.
 * Handles camelCase, spaces, and non-alphanumeric characters.
 *
 * @param str - The input string to slugify
 * @param joiner - The character used to join words (default: "_")
 * @returns A slugified string
 */
export const slugify = (str: string, joiner = '_'): string => {
    return str
        // Handle camelCase by adding joiner between lowercase → uppercase
        .replace(/([a-z])([A-Z])/g, `$1${joiner}$2`)
        // Replace spaces and non-alphanumeric characters with joiner
        .replace(/[\s\W]+/g, joiner)
        // Remove duplicate joiners
        .replace(new RegExp(`${joiner}{2,}`, 'g'), joiner)
        // Trim joiners from start/end
        .replace(new RegExp(`^${joiner}|${joiner}$`, 'g'), '')
        .toLowerCase()
}

/**
 * Truncates a string to a specified length and appends an ellipsis if needed.
 *
 * @param str - The input string
 * @param len - Maximum length of the result (including ellipsis)
 * @param ellipsis - String to append if truncated (default: "...")
 * @returns The truncated string
 */
export const subString = (
    str: string,
    len: number,
    ellipsis: string = '...'
): string => {
    if (!str) return ''
    if (len <= ellipsis.length) return ellipsis // Avoid negative slicing

    return str.length > len
        ? str.substring(0, len - ellipsis.length).trimEnd() + ellipsis
        : str
}

/**
 * Replaces placeholders in a string with corresponding values from a data object.
 * 
 * Example:
 * substitute("Hello { user.name }!", { user: { name: "John" } })
 * // "Hello John!"
 *
 * @param str - The string containing placeholders wrapped in { } braces.
 * @param data - Object containing values to substitute. Supports nested keys via dot notation.
 * @param def - Default value to use if a key is missing. (Optional)
 * @returns The substituted string or undefined if the input string or data is invalid.
 */
export const substitute = (
    str: string,
    data: Record<string, unknown> = {},
    def?: string
): string | undefined => {
    if (!str || !data) return undefined

    // Matches { key } or { nested.key } placeholders
    const regex = /{\s*([a-zA-Z0-9_.]+)\s*}/g

    // Flatten the data so we can directly access dot notation keys
    const flattened = dot(data)

    // Replace each placeholder with its value or the default
    const out = str.replace(regex, (_, key: string) => {
        const value = flattened[key]
        return value !== undefined ? String(value) : def ?? ''
    })

    return out
}

/**
 * Truncates a string to a specified length, removing HTML tags and 
 * appending a suffix if the string exceeds the length.
 *
 * @param str - The string to truncate
 * @param len - Maximum length (default: 20)
 * @param suffix - Suffix to append if truncated (default: "...")
 * @returns The truncated string
 */
export const truncate = (
    str: string,
    len: number = 20,
    suffix: string = '...'
): string => {
    if (!str) return ''

    // Remove any HTML tags
    const clean = str.replace(/<[^>]+>/g, '')

    // Determine if we need to truncate
    const truncated =
        clean.length > len
            ? clean.substring(0, len - suffix.length) + suffix
            : clean

    // Normalize spaces and line breaks
    return truncated
        .replace(/\n/g, ' ') // Replace all line breaks
        .replace(new RegExp(`\\s+${suffix.replace(/\./g, '\\.')}$`), suffix) // Avoid extra space before suffix
}

