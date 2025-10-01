import { dot } from './Obj'

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

/** Capitalizes the first character of a string. */
export function capitalize (str: string): string {
    if (!str) return ''
    return str[0].toUpperCase() + str.slice(1)
}

/**
 * Returns the pluralized form of a word based on the given number.
 */
export const pluralize = (word: string, count: number): string => {
    if (count === 1) return word
    const irregularPlurals: Record<string, string> = {
        foot: 'feet', child: 'children', mouse: 'mice', goose: 'geese',
        person: 'people', man: 'men', woman: 'women',
    }
    if (word in irregularPlurals) return irregularPlurals[word]
    if (word.endsWith('y') && !['a','e','i','o','u'].includes(word.at(-2)?.toLowerCase() ?? '')) {
        return word.slice(0, -1) + 'ies'
    }
    if (/(s|ss|sh|ch|x|z)$/i.test(word)) return word + 'es'
    return word + 's'
}

/** Converts a plural English word into its singular form. */
export const singularize = (word: string): string => {
    const irregulars: Record<string, string> = {
        feet: 'foot', children: 'child', mice: 'mouse', geese: 'goose',
        people: 'person', men: 'man', women: 'woman',
    }
    if (word in irregulars) return irregulars[word]
    if (/ies$/i.test(word) && word.length > 3) return word.replace(/ies$/i, 'y')
    if (/(ches|shes|sses|xes|zes)$/i.test(word)) return word.replace(/es$/i, '')
    if (/s$/i.test(word) && word.length > 1) return word.replace(/s$/i, '')
    return word
}

/** Converts a string into a slug format. */
export const slugify = (str: string, joiner = '_'): string => {
    const core = str
        .replace(/([a-z])([A-Z])/g, `$1${joiner}$2`)
        .replace(/[\s\W]+/g, joiner)
        .replace(new RegExp(`${joiner}{2,}`, 'g'), joiner)
        .toLowerCase()
    return core
}

/** Truncates a string to a specified length and appends an ellipsis if needed. */
export const subString = (
    str: string,
    len: number,
    ellipsis: string = '...'
): string => {
    if (!str) return ''
    if (len <= ellipsis.length) return ellipsis
    return str.length > len ? str.substring(0, len - ellipsis.length).trimEnd() + ellipsis : str
}

/** Substitute placeholders { key } using object with dot notation. */
export const substitute = (
    str: string,
    data: Record<string, unknown> = {},
    def?: string
): string | undefined => {
    if (!str || !data) return undefined
    const regex = /{\s*([a-zA-Z0-9_.]+)\s*}/g
    const flattened = dot(data)
    return str.replace(regex, (_, key: string) => {
        const value = flattened[key]
        return value !== undefined ? String(value) : def ?? ''
    })
}

/** Truncate string removing HTML tags and append suffix if needed. */
export const truncate = (
    str: string,
    len: number = 20,
    suffix: string = '...'
): string => {
    if (!str) return ''
    const clean = str.replace(/<[^>]+>/g, '')
    const out = clean.length > len ? clean.substring(0, len - suffix.length) + suffix : clean
    return out.replace(/\n/g, ' ').replace(new RegExp(`\\s+${suffix.replace(/\./g, '\\.')}$`), suffix)
}

/** Get substring from offset/length similar to PHP substr. */
export const substr = (string: string, offset: number, length?: number): string => {
    if (offset < 0) offset += string.length
    if (length === undefined) return string.substring(offset)
    return string.substring(offset, offset + length)
}

/** Get substring by start/stop indexes. */
export const sub = (string: string, start: number, stop: number): string => string.substring(start, stop)

/** Escape string for JSON encoding (returns string without quotes). */
export const esc = (string: string): string => JSON.stringify(string).slice(1, -1)

/** Padding to a fixed size, right by default. */
export const padString = (
    string: string,
    size: number,
    padString: string = ' ',
    padRight: boolean = true
): string => {
    if (string.length >= size) return string
    const pad = padString.repeat(size - string.length)
    return padRight ? string + pad : pad + string
}

/** Split by delimiter with edge-case rule. */
export const split = (string: string, delimiter: string): string[] => {
    if (string.startsWith(delimiter) || string.endsWith(delimiter)) return ['']
    return string.split(delimiter)
}

/** Returns all the characters except the last. */
export const chop = (string: string): string => string.slice(0, -1)

/** Number checks. */
export const isNumber = (string: string): boolean => !isNaN(Number(string)) && string.trim() !== ''
export const isInteger = (string: string): boolean => Number.isInteger(Number(string)) && string.trim() !== ''

/** ROT-N cipher. */
export const rot = (string: string, n: number = 13): string => {
    return string.replace(/[a-zA-Z]/g, (char: string) => {
        const code = char.charCodeAt(0)
        const start = char >= 'a' ? 'a'.charCodeAt(0) : 'A'.charCodeAt(0)
        const end = char >= 'a' ? 'z'.charCodeAt(0) : 'Z'.charCodeAt(0)
        let next = code + n
        while (next < start) next += 26
        while (next > end) next -= 26
        return String.fromCharCode(next)
    })
}

/** Replace trailing punctuation with new format. */
export const replacePunctuation = (string: string, newFormat: string): string => string.replace(/[.,;:!?]*$/, '') + newFormat

/** Array/object driven text replacement. */
export const translate = (string: string, replacements: Record<string, string> | Array<[string, string]>): string => {
    let result = string
    if (Array.isArray(replacements)) {
        for (const [from, to] of replacements) result = result.replace(new RegExp(from, 'g'), to)
    } else {
        for (const [from, to] of Object.entries(replacements)) result = result.replace(new RegExp(from, 'g'), to)
    }
    return result
}

/** Strip slashes recursively. */
export const ss = (string: string): string => string.replace(/\\(.)/g, '$1')

/** First and last N lines. */
export const firstLines = (string: string, amount: number = 1): string => string.split('\n').slice(0, amount).join('\n')
export const lastLines = (string: string, amount: number = 1): string => string.split('\n').slice(-amount).join('\n')

