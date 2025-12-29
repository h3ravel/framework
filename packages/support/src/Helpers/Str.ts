import type { Callback, ExcerptOptions, Fallback, Function, HtmlStringType, Value } from '../Contracts/StrContract'

import { dot } from './Obj'
import { isIP } from 'node:net'

export enum Mode {
    MB_CASE_UPPER = 0,
    MB_CASE_LOWER = 1,
    MB_CASE_TITLE = 2,
    MB_CASE_FOLD = 3,
    MB_CASE_UPPER_SIMPLE = 4,
    MB_CASE_LOWER_SIMPLE = 5,
    MB_CASE_TITLE_SIMPLE = 6,
    MB_CASE_FOLD_SIMPLE = 7
}

export class Str {
    /**
     * The callback that should be used to generate UUIDs.
     *
     * @type { Function | null }
     */
    protected static uuidFactory: Function | null = null

    /**
     * The callback that should be used to generate ULIDs.
     *
     * @type { Function | null }
     */
    protected static ulidFactory: Function | null = null

    /**
     * The callback that should be used to generate random strings.
     *
     * @type { Function | null }
     */
    protected static randomStringFactory: Function | null = null

    /**
     * Get a new Stringable object from the given string.
     *
     * @param { string } string
     */
    static of (string: string): Stringable {
        return new Stringable(string)
    }

    /**
     * Return the remainder of a string after the first occurrence of a given value.
     *
     * @param { string } subject
     * @param { string } search
     *
     * @return { string }
     */
    static after (subject: string, search: string): string {
        if (search === '') {
            return subject
        }

        return subject.slice(subject.indexOf(search) + search.length)
    }

    /**
     * Return the remainder of a string after the last occurrence of a given value.
     *
     * @param { string } subject
     * @param { string } search
     *
     * @return { string }
     */
    static afterLast (subject: string, search: string): string {
        if (search === '') {
            return subject
        }

        const position: number = subject.lastIndexOf(search)

        if (position === -1) {
            return subject
        }

        return subject.substring(position + search.length)
    }

    /**
     * Transliterate a UTF-8 value to ASCII.
     *
     * @param { string } value
     *
     * @return { string }
     */
    static ascii (value: string): string {
        return value.normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-zA-Z0-9]/g, '')
    }

    /**
     * Get the portion of a string before the first occurrence of a given value.
     *
     * @param { string } subject
     * @param { string } search
     *
     * @return { string }
     */
    static before (subject: string, search: string): string {
        if (search === '') {
            return subject
        }

        const result: string = subject.substring(0, subject.indexOf(search))

        if (result === '') {
            return subject
        }

        return result
    }

    /**
     * Get the portion of a string before the last occurrence of a given value.
     *
     * @param { string } subject
     * @param { string } search
     *
     * @return { string }
     */
    static beforeLast (subject: string, search: string): string {
        if (search === '') {
            return subject
        }

        const position: number | null = subject.lastIndexOf(search) ?? null

        if (position === -1) {
            return subject
        }

        return this.substr(subject, 0, position)
    }

    /**
     * Get the portion of a string between two given values.
     *
     * @param { string } subject
     * @param { string } from
     * @param { string } to
     *
     * @return { string }
     */
    static between (subject: string, from: string, to: string): string {
        if (from === '' || to === '') {
            return subject
        }

        return this.beforeLast(this.after(subject, from), to)
    }

    /**
     * Get the smallest possible portion of a string between two given values.
     *
     * @param { string } subject
     * @param { string } from
     * @param { string } to
     *
     * @return { string }
     */
    static betweenFirst (subject: string, from: string, to: string): string {
        if (from === '' || to === '') {
            return subject
        }

        return this.before(this.after(subject, from), to)
    }

    /**
     * Convert a value to camel case.
     *
     * @param { string } value
     *
     * @return { string }
     */
    static camel (value: string): string {
        return this.lcfirst(this.studly(value))
    }

    /**
     * Get the character at the specified index.
     *
     * @param { string } subject
     * @param { number } index
     *
     * @return { string | false }
     */
    static charAt (subject: string, index: number): string | false {
        return subject.charAt(index)
    }

    /**
     * Remove the given string(s) if it exists at the start of the haystack.
     *
     * @param { string } subject
     * @param { string | string[] } needle
     *
     * @return string
     */
    static chopStart (subject: string, needle: string | string[]): string {
        let results: string = subject

        needle = Array.isArray(needle) ? needle : [needle]

        needle.forEach((word: string): void => {
            if (subject.startsWith(word)) {
                results = subject.substring(word.length)
            }
        })

        return results
    }

    /**
     * Remove the given string(s) if it exists at the end of the haystack.
     *
     * @param { string } subject
     * @param { string | string[] } needle
     *
     * @return string
     *
     */
    static chopEnd (subject: string, needle: string | string[]): string {
        let results: string = subject

        needle = Array.isArray(needle) ? needle : [needle]

        needle.forEach((word: string): void => {
            if (subject.endsWith(word)) {
                results = subject.substring(0, subject.length - word.length)
            }
        })

        return results
    }

    /**
     * Determine if a given string contains a given substring.
     *
     * @param { string } haystack
     * @param { string | string[] } needles
     * @param { boolean } ignoreCase
     *
     * @return { boolean }
     */
    static contains (haystack: string, needles: string | string[], ignoreCase: boolean = false): boolean {
        let result: boolean = false

        if (ignoreCase) {
            haystack = haystack.toLowerCase()
        }

        needles = Array.isArray(needles) ? needles : [needles]

        needles.forEach((needle: string): void => {
            if (ignoreCase) {
                needle = needle.toLowerCase()
            }

            if (needle !== '' && haystack.includes(needle)) {
                result = true
            }
        })

        return result
    }

    /**
     * Determine if a given string contains all array values.
     *
     * @param { string } haystack
     * @param { string[] } needles
     * @param { boolean } ignoreCase
     *
     * @return { boolean }
     */
    static containsAll (haystack: string, needles: string[], ignoreCase: boolean = false): boolean {
        let result: boolean = true

        needles.forEach((needle: string): void => {
            if (!this.contains(haystack, needle, ignoreCase)) {
                result = false
            }
        })

        return result
    }

    /**
     * Convert the case of a string.
     *
     * @param { string } string
     * @param { Mode | number } mode
     *
     * @return { string }
     */
    static convertCase (string: string, mode: Mode | number = Mode.MB_CASE_FOLD): string {
        switch (mode) {
            case Mode.MB_CASE_UPPER: {
                string = string.toLocaleUpperCase()

                break
            }
            case Mode.MB_CASE_LOWER: {
                string = string.toLocaleLowerCase()

                break
            }
            case Mode.MB_CASE_TITLE: {
                string = this.title(string)

                break
            }
            case Mode.MB_CASE_FOLD: {
                string = string.toLocaleLowerCase()

                break
            }
            case Mode.MB_CASE_UPPER_SIMPLE: {
                string = string.toUpperCase()

                break
            }
            case Mode.MB_CASE_LOWER_SIMPLE: {
                string = string.toLowerCase()

                break
            }
            case Mode.MB_CASE_TITLE_SIMPLE: {
                string = this.title(string)

                break
            }
            case Mode.MB_CASE_FOLD_SIMPLE: {
                string = string.toLowerCase()

                break
            }
        }

        return string
    }

    /**
     * Detect content type
     * 
     * @param content 
     * @returns 
     */
    static detectContentType (content: any) {
        if (typeof content !== 'string') {
            return 'json'
        }

        const trimmed = content.trim()

        /**
         * JSON check 
         */
        if (/^[[{]/.test(trimmed)) {
            try {
                JSON.parse(trimmed)
                return 'json'
            } catch {/** */ }
        }

        /**
         * XML check 
         */
        if (/^<\?xml/i.test(trimmed) || /^<[A-Za-z]+[^>]*>/.test(trimmed)) {
            // If it looks like XML but not HTML
            if (!/^<!DOCTYPE html>/i.test(trimmed) && !/<html[\s>]/i.test(trimmed)) {
                return 'xml'
            }
        }

        /**
         * HTML check 
         */
        if (/<(html|head|body|div|span|p|!DOCTYPE)/i.test(trimmed)) {
            return 'html'
        }

        return 'text'
    }

    /**
     * Determine if a given string doesn't contain a given substring.
     *
     * @param { string } haystack
     * @param { string | string[] } needles
     * @param { boolean } ignoreCase
     *
     * @return { boolean }
     */
    static doesntContain (haystack: string, needles: string | string[], ignoreCase: boolean = false): boolean {
        return !this.contains(haystack, needles, ignoreCase)
    }

    /**
     * Replace consecutive instances of a given character with a single character in the given string.
     *
     * @param { string } string
     * @param { string | string[] } characters
     *
     * @return { string }
     */
    static deduplicate (string: string, characters: string | string[] = ' '): string {
        if (Array.isArray(characters)) {
            return characters.reduce((carry: string, character: string): string => carry.replace(new RegExp(`${character.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}+`, 'gu'), character), string)
        }

        return string.replace(new RegExp(`${preg_quote(characters)}+`, 'gu'), characters)
    }

    /**
     * Determine if a given string ends with a given substring.
     *
     * @param { string } haystack
     * @param { string | string[] } needles
     *
     * @return { boolean }
     */
    static endsWith (haystack: string, needles: string | string[]): boolean {
        needles = Array.isArray(needles) ? needles : [needles]

        return needles.some((needle: string): boolean => needle !== '' && haystack.endsWith(needle))
    }

    /**
     * Determine if a given string doesn't end with a given substring.
     *
     * @param { string } haystack
     * @param { string | string[] } needles
     *
     * @return { boolean }
     */
    static doesntEndWith (haystack: string, needles: string | string[]): boolean {
        return !this.endsWith(haystack, needles)
    }

    /**
     * Returns all the characters except the last.
     * 
     * @param string 
     * @returns 
     */
    static chop (string: string): string {
        return string.slice(0, -1)
    }

    /**
     * Escape string for JSON encoding (returns string without quotes). 
     * 
     * @param string 
     * @returns 
     */
    static esc (string: string): string {
        return JSON.stringify(string).slice(1, -1)
    }

    /**
     * Extracts an excerpt from text that matches the first instance of a phrase.
     *
     * @param { string } text
     * @param { string } phrase
     * @param { ExcerptOptions } options
     *
     * @return { string | null }
     */
    static excerpt (text: string, phrase: string = '', options: ExcerptOptions = {}): string | null {
        const radius: number = options.radius ?? 100
        const omission: string = options.omission ?? '...'
        const results: string[] = text.split(phrase)

        if (results.length === 1) {
            return null
        }

        const matches: string[] = [text, (results[0] as string), phrase, results.splice(1).join(phrase)]

        let start: string = (matches[1] as string).trimStart()
        let end: string = (matches[3] as string).trimEnd()

        start = this.of(this.substr(start, Math.max((start.length - radius), 0), radius))
            .ltrim()
            .unless(
                (startWithRadius: Stringable): boolean => startWithRadius.exactly(start),
                (startWithRadius: Stringable): Stringable => startWithRadius.prepend(omission))
            .toString()

        end = this.of(this.substr(end, 0, radius))
            .rtrim()
            .unless(
                (endWithRadius: Stringable): boolean => endWithRadius.exactly(end),
                (endWithRadius: Stringable): Stringable => endWithRadius.append(omission))
            .toString()

        return (start + ' ' + matches[2] + end).replace(/\s+/g, ' ').trim()
    }

    /**
     * Explode the string into an array.
     *
     * @param { string } string
     * @param { string } delimiter
     * @param { number } limit
     *
     * @return { string[] }
     */
    static explode (string: string, delimiter: string, limit: number = 0): string[] {
        let wordsArray: string[] = string.split(delimiter)

        const position: number = limit - 1 >= wordsArray.length
            ? wordsArray.length - 1
            : limit - 1

        wordsArray = [...wordsArray.slice(0, position), wordsArray.splice(position).join(' ')]

        return wordsArray
    }

    /**
     * Cap a string with a single instance of a given value.
     *
     * @param { string } value
     * @param { string } cap
     *
     * @return { string }
     */
    static finish (value: string, cap: string): string {
        return value.endsWith(cap) ? value : value + cap
    }

    /**
     * Wrap the string with the given strings.
     *
     * @param { string } value
     * @param { string } before
     * @param { string | null } after
     *
     * @return string
     */
    static wrap (value: string, before: string, after: string | null = null): string {
        return before + value + (after ?? before)
    }

    /**
     * Unwrap the string with the given strings.
     *
     * @param { string } value
     * @param { string } before
     * @param { string | null } after
     *
     * @return { string }
     */
    static unwrap (value: string, before: string, after: string | null = null): string {
        if (this.startsWith(value, before)) {
            value = this.replaceFirst(before, '', value)
        }

        if (this.endsWith(value, after ?? before)) {
            value = this.replaceLast(after ?? before, '', value)
        }

        return value
    }

    /**
     * Determine if a given string matches a given pattern.
     *
     * @param { string | string[] } pattern
     * @param { string } value
     * @param { boolean } ignoreCase
     *
     * @return { boolean }
     */
    static is (pattern: string | string[], value: string, ignoreCase: boolean = false): boolean {
        const patterns: string[] = Array.isArray(pattern) ? pattern : [pattern]

        for (let pattern of patterns) {
            if (pattern === value) {
                return true
            }

            if (ignoreCase && pattern.toLowerCase() === value.toLowerCase()) {
                return true
            }

            pattern = pattern.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&').replace(/\\\*/g, '.*')

            const regex: RegExp = new RegExp('^' + pattern + '$', ignoreCase ? 'iu' : 'u')

            if (regex.test(value)) {
                return true
            }
        }

        return false
    }

    /**
     * Determine if a given string is 7-bit ASCII.
     *
     * @param { string } value
     *
     * @return { boolean }
     */
    static isAscii (value: string): boolean {
        return !/[^ -~\t\r\n]/.test(value)
    }

    /**
     * Determine if a given string is valid JSON.
     *
     * @param { string } value
     *
     * @return { boolean }
     */
    static isJson (value: string): boolean {
        try {
            JSON.parse(value)
        } catch {
            return false
        }

        return true
    }

    /**
     * Determine if a given value is a valid URL.
     *
     * @param { string } value
     * @param { string[] } protocols
     *
     * @return { boolean }
     */
    static isUrl (value: string, protocols: string[] = []): boolean {
        const protocolPattern: string = protocols.length === 0 ? 'https?|ftp|file|mailto|tel|data|irc|magnet' : protocols.join('|')

        const pattern: RegExp = new RegExp(`^(?:${protocolPattern}):\\/\\/(?:[\\w-]+(?:\\.[\\w-]+)+|localhost|\\d{1,3}(?:\\.\\d{1,3}){3})(?::\\d+)?(?:\\S*)?$`, 'i')

        return pattern.test(value)
    }

    /**
     * Determine if a given string is a valid UUID.
     *
     * @param { string } value
     *
     * @return { boolean }
     */
    static isUuid (value: string): boolean {
        return new RegExp(/^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/).test(value)
    }

    /**
     * Determine if a given string is a valid ULID.
     *
     * @param { string } value
     *
     * @return { boolean }
     */
    static isUlid (value: string): boolean {
        if (value.length !== 26) {
            return false
        }

        if (value.length !== value.match(/[0123456789ABCDEFGHJKMNPQRSTVWXYZabcdefghjkmnpqrstvwxyz]/g)?.length) {
            return false
        }

        return Number(value.charAt(0)) <= 7
    }

    /**
     * Convert a string to kebab case.
     *
     * @param { string } value
     *
     * @return { string }
     */
    static kebab (value: string): string {
        return this.snake(value, '-')
    }

    /**
     * Return the length of the given string.
     *
     * @param { string } value
     *
     * @return { number }
     */
    static length (value: string): number {
        return value.length
    }

    /**
     * Limit the number of characters in a string.
     *
     * @param { string } value
     * @param { number } limit
     * @param { string } end
     * @param { boolean } preserveWords
     *
     * @return { string }
     */
    static limit (
        value: string,
        limit: number = 100,
        end: string = '...',
        preserveWords: boolean = false
    ): string {
        value = value.replace(/<[^>]+>/g, '')

        if (value.length <= limit) {
            return value
        }

        if (!preserveWords) {
            return this.substr(value, 0, limit).trim() + end
        }

        value = value.replace(/[\n\r]+/, ' ')

        const trimmed: string = this.substr(value, 0, limit).trim()

        if (this.substr(value, limit, 1) === ' ') {
            return `${trimmed}${end}`
        }

        return `${trimmed.replace(/(.*)\s.*/, '$1')}${end}`
    }

    /**
     * Limit the number of characters in a string.
     *
     * @param { string } value
     * @param { number } limit
     * @param { string } end
     * @param { boolean } preserveWords
     *
     * @alias limit
     * @return { string }
     */
    static truncate (
        value: string, limit: number = 100, end: string = '...', preserveWords: boolean = false
    ): string {
        return this.limit(value, limit, end, preserveWords)
    }

    /**
     * Convert the given string to lower-case.
     *
     * @param { string } value
     *
     * @return { string }
     */
    static lower (value: string): string {
        return value.toLowerCase()
    }

    /**
     * Parse a Class[@]method style callback into class and method.
     *
     * @param callback
     * @param defaultValue
     */
    static parseCallback (callback: string, defaultValue?: string) {
        if (this.contains(callback, 'anonymous')) {
            if (this.substrCount(callback, '@') > 1) {
                return [
                    this.beforeLast(callback, '@'),
                    this.afterLast(callback, '@'),
                ]
            }

            return [callback, defaultValue]
        }

        return this.contains(callback, '@') ? callback.split('@', 2) : [callback, defaultValue]
    }

    /**
     * Get substring by start/stop indexes.
     * 
     * @param string 
     * @param start 
     * @param stop 
     * @returns 
     */
    static sub (string: string, start: number, stop: number): string {
        return string.substring(start, stop)
    }

    /**
     * Limit the number of words in a string.
     *
     * @param { string } value
     * @param { number } words
     * @param { string } end
     *
     * @return { string }
     */
    static words (value: string, words: number = 100, end: string = '...'): string {
        const wordsArray: string[] = value.match(/\S+\s*/g)?.splice(0, words) ?? []

        const result: string = wordsArray.join('')

        if (wordsArray.length === 1 || this.length(value) === this.length(result)) {
            return value
        }

        return result.trim() + end
    }

    /**
     * Masks a portion of a string with a repeated character.
     *
     * @param { string } string
     * @param { string } character
     * @param { number } index
     * @param { number | null } length
     *
     * @return { string }
     */
    static mask (string: string, character: string, index: number, length: number | null = null): string {
        if (character === '') {
            return string
        }

        let start: number | string = index
        let endIndex: number = length ?? string.length

        if (start < 0) {
            start = string.length + start
            endIndex = start + (length ?? 0)
        }

        if (endIndex === 0) {
            endIndex = start
        }

        const segment: string = string.substring(start, endIndex)

        if (segment === '') {
            return string
        }

        const strLen: number = string.length
        let startIndex: number = index

        if (index < 0) {
            startIndex = index < -strLen ? 0 : strLen + index
        }

        start = string.substring(0, startIndex)

        const segmentLen: number = segment.length
        const end: string = string.substring(startIndex + segmentLen)

        return start + character.substring(0, 1).repeat(segmentLen) + end
    }

    /**
     * Get the string matching the given pattern.
     *
     * @param { string } pattern
     * @param { string } subject
     *
     * @return { string }
     */
    static match (pattern: string, subject: string): string {
        const body: string = RegExpString.make(/^\/(.*)\/\w*$/, pattern)
        const flags: string = RegExpString.make(/^\/.*\/(\w*)$/, pattern)
        const expression: RegExp = new RegExp(body, flags)

        const matches: RegExpMatchArray | null = RegExp(expression).exec(subject)

        if (!matches) {
            return ''
        }

        return matches[1] ?? matches[0]
    }

    /**
     * Determine if a given string matches a given pattern.
     *
     * @param { string | string[] } pattern
     * @param { string } value
     *
     * @return { boolean }
     */
    static isMatch (pattern: string | string[], value: string): boolean {
        let result: boolean = false

        pattern = Array.isArray(pattern) ? pattern : [pattern]

        pattern.forEach((item: string): void => {
            if (item === value) {
                result = true
            }

            const body: string = (/^\/(.*)\/\w*$/.exec(item) as string[])[1] as string
            const flags: string = (/^\/.*\/(\w*)$/.exec(item) as string[])[1] as string
            const expression: RegExp = new RegExp(body, flags)

            if (expression.exec(value)) {
                result = true
            }
        })

        return result
    }

    /**
     * Get the string matching the given pattern.
     *
     * @param { string } pattern
     * @param { string } subject
     *
     * @return { string[] }
     */
    static matchAll (pattern: string, subject: string): string[] {
        const body: string = RegExpString.make(/^\/(.*)\/\w*$/, pattern)
        const flags: string = RegExpString.make(/^\/.*\/(\w*)$/, pattern)

        const expression: RegExp = new RegExp(body, flags + (flags.indexOf('g') !== -1 ? '' : 'g'))

        const matches: RegExpMatchArray[] = [...subject.matchAll(new RegExp(expression, 'g'))]

        if (matches.length === 0) {
            return []
        }

        return matches.map((match: RegExpMatchArray): string => String(match.length === 1 ? match[0] : match[1]))
    }

    /**
     * Remove all non-numeric characters from a string.
     *
     * @param { string } value
     *
     * @return { string }
     */
    static numbers (value: string): string {
        return value.replace(/\D/g, '')
    }

    /**
     * Pad both sides of a string with another.
     *
     * @param { string } value
     * @param { number } length
     * @param { string } pad
     *
     * @return { string }
     */
    static padBoth (value: string, length: number, pad: string = ' '): string {
        const short: number = Math.max(0, length - value.length)
        const shortLeft: number = Math.floor(short / 2)
        const shortRight: number = Math.ceil(short / 2)

        return pad.repeat(shortLeft).substring(0, shortLeft) + value + pad.repeat(shortRight).substring(0, shortRight)
    }

    /**
     * Pad the left side of a string with another.
     *
     * @param { string } value
     * @param { number } length
     * @param { string } pad
     *
     * @return { string }
     */
    static padLeft (value: string, length: number, pad: string = ' '): string {
        const short: number = Math.max(0, length - (value.length ?? 0))

        return pad.repeat(short).substring(0, short) + value
    }

    /**
     * Pad the right side of a string with another.
     *
     * @param { string } value
     * @param { number } length
     * @param { string } pad
     *
     * @return { string }
     */
    static padRight (value: string, length: number, pad: string = ' '): string {
        const short: number = Math.max(0, length - value.length)

        return value + pad.repeat(short).substring(0, short)
    }

    /**
     * Get the plural form of an English word.
     *
     * @param { string } value
     * @param { number | array } count
     *
     * @return { string }
     */
    static plural (value: string, count: number | number[] = 2): string {
        if ((count !== undefined && count === 1) || value.trim() === '') {
            return value
        }

        // List of rules for plural words.
        const plural: { [key: string]: string } = {
            // Special cases (unchanged plurals)
            '^(.*)menu$': '$1menus',
            '^tights$': 'tights',
            '^shorts$': 'shorts',
            '^glasses$': 'glasses',
            '^pants$': 'pants',

            // -us -> -i (second declension nouns)
            '(alumn|bacill|cact|foc|fung|nucle|radi|stimul|syllab|termin|vir)us$': '$1i',
            '(vir)us$': '$1i',

            // -um/on -> -a (neuter nouns)
            '([ti])um$': '$1a',
            '(tax)on$': '$1a',
            '(criteri)on$': '$1a',

            // -ix/ex -> -ices
            '(matr)ix$': '$1ices',
            '(vert|ind)ex$': '$1ices',

            // -o -> -oes
            '(buffal|her|potat|tomat|volcan)o$': '$1oes',

            // -ouse -> -ouses
            '(h|bl)ouse$': '$1ouses',
            'ouse$': 'ouses',

            // -y -> -ies
            '([^aeiouy]|qu)y$': '$1ies',

            // -f/fe -> -ves
            '([lr])f$': '$1ves',
            '([^fo])fe$': '$1ves',
            '(shea|loa|lea|thie)f$': '$1ves',
            '(li|wi|kni)fe$': '$1ves',

            // -is -> -es
            '(analys|ax|cris|test|thes)is$': '$1es',

            // -e exceptions
            '(alias|status|bus)$': '$1es',
            '(shoe|slave)$': '$1s',
            '(corpse)$': '$1s',
            '(drive|dive|hive|olive|tive)$': '$1s',

            // -x -> -xes
            '([ftw]ax)$': '$1es',

            // -ouse -> -ice
            '([m|l])ouse$': '$1ice',

            // -e -> -es
            '(x|ch|ss|sh)$': '$1es',
            'o$': 'oes',

            // -ze -> -zes
            '(quiz)$': '$1zes',

            // -ox -> -oxen
            '^(ox)$': '$1en',

            // -person -> -people
            '(p)erson$': '$1eople',

            // Irregular singulars
            '(m)an$': '$1en',
            '(c)hild$': '$1hildren',
            '(f)oot$': '$1eet',
            '(m)ouse$': '$1ice',
            '(t)ooth$': '$1eeth',
            '(g)oose$': '$1eese',

            // -news (unchanged)
            '(n)ews$': '$1ews',

            // -eau -> -eaus
            'eau$': 'eaus',

            // -sis -> -ses
            '(^analy)sis$': '$1ses',
            '((a)naly|(b)a|(d)iagno|(p)arenthe|(p)rogno|(s)ynop|(t)he)sis$': '$1$2ses',

            // -ovie -> -ovies
            '(m)ovie$': '$1ovies',

            // -eries -> -eries (unchanged)
            '(s)eries$': '$1eries',

            // -us -> -uses
            '([^a])us$': '$1uses',
            'us$': 'uses',

            // -status -> -statuses
            '(s)tatus$': '$1tatuses',

            // -campus -> -campuses
            '(c)ampus$': '$1ampuses',

            // General case (add -s)
            '$': 's'
        }

        // List of words that change irregularly.
        const irregular: { [key: string]: string } = {
            // A
            'abuse': 'abuses',
            'alumna': 'alumnae',
            'alumnus': 'alumni',
            'analysis': 'analyses',
            'appendix': 'appendices',
            'atlas': 'atlases',
            'avalanche': 'avalanches',
            'axis': 'axes',
            'axe': 'axes',

            // B
            'bacillus': 'bacilli',
            'bacterium': 'bacteria',
            'basis': 'bases',
            'beau': 'beaux',
            'beef': 'beefs',
            'blouse': 'blouses',
            'brother': 'brothers',
            'brownie': 'brownies',
            'bureau': 'bureaux',

            // C
            'cache': 'caches',
            'cactus': 'cacti',
            'cafe': 'cafes',
            'calf': 'calves',
            'canvas': 'canvases',
            'cave': 'caves',
            'chateau': 'chateaux',
            'child': 'children',
            'cookie': 'cookies',
            'corpus': 'corpuses',
            'cow': 'cows',
            'crisis': 'crises',
            'criterion': 'criteria',
            'curriculum': 'curricula',
            'curve': 'curves',

            // D
            'datum': 'data',
            'deer': 'deer',
            'demo': 'demos',
            'diagnosis': 'diagnoses',
            'domino': 'dominoes',

            // E
            'echo': 'echoes',
            'elf': 'elves',
            'ellipsis': 'ellipses',
            'emphasis': 'emphases',
            'epoch': 'epochs',

            // F
            'fish': 'fish',
            'focus': 'foci',
            'foe': 'foes',
            'foot': 'feet',
            'formula': 'formulae',
            'fungus': 'fungi',

            // G
            'ganglion': 'ganglions',
            'gas': 'gases',
            'genie': 'genies',
            'genus': 'genera',
            'goose': 'geese',
            'graffito': 'graffiti',
            'grave': 'graves',

            // H
            'half': 'halves',
            'hippopotamus': 'hippopotami',
            'hoax': 'hoaxes',
            'hoof': 'hoofs',
            'human': 'humans',

            // I
            'iris': 'irises',

            // K
            'knife': 'knives',

            // L
            'larva': 'larvae',
            'leaf': 'leaves',
            'lens': 'lenses',
            'life': 'lives',
            'loaf': 'loaves',

            // M
            'man': 'men',
            'matrix': 'matrices',
            'means': 'means',
            'medium': 'media',
            'memorandum': 'memoranda',
            'money': 'monies',
            'mongoose': 'mongooses',
            'mouse': 'mice',
            'motto': 'mottoes',
            'move': 'moves',
            'mythos': 'mythoi',

            // N
            'nebula': 'nebulae',
            'neurosis': 'neuroses',
            'niche': 'niches',
            'niveau': 'niveaux',
            'nucleus': 'nuclei',
            'numen': 'numina',

            // O
            'oasis': 'oases',
            'occiput': 'occiputs',
            'octopus': 'octopuses',
            'offspring': 'offspring',
            'opus': 'opuses',
            'ox': 'oxen',

            // P
            'parenthesis': 'parentheses', 'passerby': 'passersby',
            'penis': 'penises',
            'person': 'people',
            'phenomenon': 'phenomena',
            'plateau': 'plateaux',

            // R
            'radius': 'radii',
            'runner-up': 'runners-up',

            // S
            'safe': 'safes',
            'save': 'saves',
            'scarf': 'scarves',
            'self': 'selves',
            'series': 'series',
            'sex': 'sexes',
            'sheep': 'sheep',
            'shelf': 'shelves',
            'sieve': 'sieves',
            'soliloquy': 'soliloquies',
            'son-in-law': 'sons-in-law',
            'species': 'species',
            'stadium': 'stadiums',
            'stimulus': 'stimuli',
            'stratum': 'strata',
            'swine': 'swine',
            'syllabus': 'syllabi',
            'synthesis': 'syntheses',

            // T
            'testis': 'testes',
            'thesis': 'theses',
            'thief': 'thieves',
            'tooth': 'teeth',
            'tornado': 'tornadoes',
            'trilby': 'trilbys',
            'turf': 'turfs',

            // V
            'valve': 'valves',
            'volcano': 'volcanoes',

            // W
            'wave': 'waves',
            'wife': 'wives',
            'wolf': 'wolves',

            // Z
            'zombie': 'zombies'
        }

        // List of words that do not change.
        const uncountable: string[] = [
            // A
            'advice',
            'aircraft',
            'amoyese',
            'art',
            'audio',

            // B
            'baggage',
            'bison',
            'borghese',
            'bream',
            'breeches',
            'britches',
            'buffalo',
            'butter',

            // C
            'cantus',
            'carp',
            'cattle',
            'chassis',
            'clippers',
            'clothing',
            'coal',
            'cod',
            'coitus',
            'compensation',
            'congoese',
            'contretemps',
            'coreopsis',
            'corps',
            'cotton',

            // D
            'data',
            'debris',
            'deer',
            'diabetes',
            'djinn',

            // E
            'education',
            'eland',
            'elk',
            'emoji',
            'equipment',
            'evidence',

            // F
            'faroese',
            'feedback',
            'fish',
            'flounder',
            'flour',
            'foochowese',
            'food',
            'furniture',

            // G
            'gallows',
            'genevese',
            'genoese',
            'gilbertese',
            'gold',

            // H
            'headquarters',
            'herpes',
            'hijinks',
            'homework',
            'hovercraft',
            'hottentotese',

            // I
            'impatience',
            'information',
            'innings',

            // J
            'jackanapes',
            'jeans',
            'jedi',

            // K
            'kin',
            'kiplingese',
            'knowledge',
            'kongoese',

            // L
            'leather',
            'love',
            'lucchese',
            'luggage',

            // M
            'mackerel',
            'Maltese',
            'management',
            'metadata',
            'mews',
            'money',
            'moose',
            'mumps',
            'music',

            // N
            'nankingese',
            'news',
            'nexus',
            'niasese',
            'nutrition',

            // O
            'oil',
            'offspring',

            // P
            'patience',
            'pekingese',
            'piedmontese',
            'pike',
            'pincers',
            'pistoiese',
            'plankton',
            'pliers',
            'pokemon',
            'police',
            'polish',
            'portuguese',
            'proceedings',
            'progress',

            // Q
            // (none yet)

            // R
            'rabies',
            'rain',
            'research',
            'rhinoceros',
            'rice',

            // S
            'salmon',
            'sand',
            'sarawakese',
            'scissors',
            'sea[- ]bass',
            'series',
            'shavese',
            'shears',
            'sheep',
            'shrimp',
            'siemens',
            'silk',
            'sms',
            'soap',
            'social media',
            'spacecraft',
            'spam',
            'species',
            'staff',
            'sugar',
            'swine',

            // T
            'talent',
            'toothpaste',
            'traffic',
            'travel',
            'trousers',
            'trout',
            'tuna',

            // U
            'us',

            // V
            'vermontese',
            'vinegar',

            // W
            'weather',
            'wenchowese',
            'wheat',
            'whiting',
            'wildebeest',
            'wood',
            'wool',

            // Y
            'yengeese',
            'you'
        ]

        if (uncountable.indexOf(value.toLowerCase()) >= 0) {
            return matchCase(value, value)
        }

        for (const word in irregular) {
            const pattern: RegExp = new RegExp(`${word}$`, 'i')

            if (pattern.test(value)) {
                return matchCase(value.replace(pattern, (irregular[word] as string)), value)
            }
        }

        for (const word in plural) {
            const pattern: RegExp = new RegExp(word, 'i')

            if (pattern.test(value)) {
                return matchCase(value.replace(pattern, (plural[word] as string)), value)
            }
        }

        return matchCase(value, value)
    }

    /**
     * Get the plural form of an English word.
     *
     * @param { string } value
     * @param { number | array } count
     * 
     * @alias plural
     *
     * @return { string }
     */
    static pluralize = (value: string, count: number | number[] = 2): string => {
        return this.plural(value, count)
    }

    /**
     * Pluralize the last word of an English, studly caps case string.
     *
     * @param { string } value
     * @param { number | array } count
     *
     * @return { string }
     */
    static pluralStudly (value: string, count: number | number[] = 2): string {
        const parts: string[] = value.split(/(.)(?=[A-Z])/)

        const lastWord: string = (parts.pop() as string)

        return parts.join('') + this.ucfirst(this.plural(lastWord, count))
    }

    /**
     * Pluralize the last word of an English, Pascal case string.
     *
     * @param { string } value
     * @param { number | array } count
     *
     * @return { string }
     */
    static pluralPascal (value: string, count: number | number[] = 2): string {
        return this.pluralStudly(value, count)
    }

    /**
     * Generate a random, secure password.
     *
     * @param { number } length
     * @param { boolean } letters
     * @param { boolean } numbers
     * @param { boolean } symbols
     * @param { boolean } spaces
     *
     * @return { string }
     */
    static password (length: number = 32, letters: boolean = true, numbers: boolean = true, symbols: boolean = true, spaces: boolean = false): string {
        const password: string[] = []
        let collection: string[] = []

        while (password.length < length) {
            if (letters) {
                collection = collection.concat([
                    'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k',
                    'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v',
                    'w', 'x', 'y', 'z', 'A', 'B', 'C', 'D', 'E', 'F', 'G',
                    'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R',
                    'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z',
                ])
            }

            if (numbers) {
                collection = collection.concat([
                    '0', '1', '2', '3', '4', '5', '6', '7', '8', '9',
                ])
            }

            if (symbols) {
                collection = collection.concat([
                    '~', '!', '#', '$', '%', '^', '&', '*', '(', ')', '-',
                    '_', '.', ',', '<', '>', '?', '/', '\\', '{', '}', '[',
                    ']', '|', ':', ';',
                ])
            }

            if (spaces) {
                collection = collection.concat([' '])
            }

            password.push((collection[Math.floor(Math.random() * collection.length)] as string))
        }

        return password.join('')
    }

    /**
     * Find the position of the first occurrence of a given substring in a string.
     *
     * @param { string } haystack
     * @param { string } needle
     * @param { number } offset
     *
     * @return { number | false }
     */
    static position (haystack: string, needle: string, offset: number = 0): number | false {
        const position: number = haystack.indexOf(needle, Math.max(offset, 0))

        return position !== -1 ? position : false
    }

    /**
     * Generate a more truly "random" alpha-numeric string.
     *
     * @param { number } length
     *
     * @return { string }
     */
    static random (length: number = 16): string {
        if (this.randomStringFactory !== null) {
            return this.randomStringFactory(length)
        }

        const byteSize: number = Math.ceil((length) / 3) * 3

        const bytes: string = crypto.getRandomValues(new Uint8Array(byteSize)).join('')

        let string: string = btoa(bytes);

        ['/', '+', '='].forEach((character: string): string => string = string.replace(character, ''))

        return string.substring(0, length)
    }

    /**
     * Set the callable that will be used to generate random strings.
     *
     * @param { ((length: number) => string) | null } factory
     *
     * @return { void }
     */
    static createRandomStringsUsing (factory: ((length: number) => string) | null = null): void {
        this.randomStringFactory = factory
    }

    /**
     * Set the sequence that will be used to generate random strings.
     *
     * @param { (string | undefined)[] } sequence
     * @param { Function | null } whenMissing
     *
     * @return { void }
     */
    static createRandomStringsUsingSequence (sequence: (string | undefined)[], whenMissing: Function | null = null): void {
        let next: number = 0

        whenMissing ??= (length: number): string => {
            const factoryCache: Function | null = this.randomStringFactory

            this.randomStringFactory = null

            const randomString: string = this.random(length)

            this.randomStringFactory = factoryCache

            next++

            return randomString
        }

        this.createRandomStringsUsing((length: number): any => {
            if (sequence[next] !== undefined) {
                return sequence[next++]
            }

            return whenMissing(length)
        })
    }

    /**
     * Indicate that random strings should be created normally and not using a custom factory.
     *
     * @return { void }
     */
    static createRandomStringsNormally (): void {
        this.randomStringFactory = null
    }

    /**
     * Repeat the given string.
     *
     * @param { string } string
     * @param { number } times
     *
     * @return { string }
     */
    static repeat (string: string, times: number = 1): string {
        return string.repeat(times)
    }

    /**
     * Replace a given value in the string sequentially with an array.
     *
     * @param { string[] } replace
     * @param { string } subject
     * @param { string } search
     *
     * @return { string }
     */
    static replaceArray (search: string, replace: string[], subject: string): string {
        const segments: string[] = subject.split(search)

        let result: string = segments.shift()!

        segments.forEach((segment: string): string => result += Str.toStringOr(replace.shift() ?? search, search) + segment)

        return result
    }

    /**
     * Convert the given value to a string or return the given fallback on failure.
     *
     * @param { * } value
     * @param { string } fallback
     *
     * @return { string }
     */
    static toStringOr (value: any, fallback: string): string {
        try {
            const result: string = String(value)

            if (result === 'undefined' || result === 'null') {
                return fallback
            }

            return result
        } catch {
            return fallback
        }
    }

    /**
     * Replace the given value in the given string.
     *
     * @param { string | string[] } search
     * @param { string } replace
     * @param { string } subject
     * @param { boolean } caseSensitive
     *
     * @return { string }
     */
    static replace (search: string | string[], replace: string, subject: string, caseSensitive: boolean = true): string {
        search = Array.isArray(search) ? search : [search]

        search.forEach((term: string | RegExp): void => {
            if (!caseSensitive) {
                term = new RegExp(term, 'gi')
            }

            subject = subject.replaceAll(term, replace)
        })

        return subject
    }

    /**
     * Replace the first occurrence of a given value in the string.
     *
     * @param { string } search
     * @param { string } replace
     * @param { string } subject
     *
     * @return { string }
     */
    static replaceFirst (search: string, replace: string, subject: string): string {
        if (search === '') {
            return subject
        }

        const position: number = subject.indexOf(search)

        if (position !== undefined) {
            return subject.replace(search, replace)
        }

        return subject
    }

    /**
     * Replace the first occurrence of the given value if it appears at the start of the string.
     *
     * @param { string } search
     * @param { string } replace
     * @param { string } subject
     *
     * @return { string }
     */
    static replaceStart (search: string, replace: string, subject: string): string {
        if (search === '') {
            return subject
        }

        if (this.startsWith(subject, search)) {
            return this.replaceFirst(search, replace, subject)
        }

        return subject
    }

    /**
     * Replace the last occurrence of a given value in the string.
     *
     * @param { string } search
     * @param { string } replace
     * @param { string } subject
     *
     * @return { string }
     */
    static replaceLast (search: string, replace: string, subject: string): string {
        if (search === '') {
            return subject
        }

        const position: number = subject.lastIndexOf(search)

        if (position !== 0) {
            return subject.substring(0, position) + replace + subject.substring(position + search.length)
        }

        return subject
    }

    /**
     * Replace the last occurrence of a given value if it appears at the end of the string.
     *
     * @param { string } search
     * @param { string } replace
     * @param { string } subject
     *
     * @return { string }
     */
    static replaceEnd (search: string, replace: string, subject: string): string {
        if (search === '') {
            return subject
        }

        if (this.endsWith(subject, search)) {
            return this.replaceLast(search, replace, subject)
        }

        return subject
    }

    /**
     * Replace the patterns matching the given regular expression.
     *
     * @param { string } pattern
     * @param { string | function } replace
     * @param { string } subject
     *
     * @return { string }
     */
    static replaceMatches (pattern: string, replace: string | Function, subject: string): string {
        const body: string = RegExpString.make(/^\/(.*)\/\w*$/, pattern)
        const flags: string = RegExpString.make(/^\/.*\/(\w*)$/, pattern)
        const expression: RegExp = new RegExp(body, flags + (flags.indexOf('g') !== -1 ? '' : 'g'))

        if (replace instanceof Function) {
            subject = subject.replace(expression, (matched: string): string => matched)
        }

        return subject.replace(expression, (replace as string))
    }

    /**
     * Remove any occurrence of the given string in the subject.
     *
     * @param { string } search
     * @param { string } subject
     * @param { boolean } caseSensitive
     *
     * @return { string }
     */
    static remove (search: string, subject: string, caseSensitive: boolean = true): string {
        return subject.replace(new RegExp(search, caseSensitive ? 'g' : 'gi'), '')
    }

    /**
     * Reverse the given string.
     *
     * @param { string } value
     *
     * @return { string }
     */
    static reverse (value: string): string {
        return value.split('').reverse().join('')
    }

    /**
     * Begin a string with a single instance of a given value.
     *
     * @param { string } value
     * @param { string } prefix
     *
     * @return { string }
     */
    static start (value: string, prefix: string): string {
        const quoted: string = preg_quote(prefix, '/')

        return prefix + value.replace(new RegExp(`^(?:${quoted})+`, 'u'), '')
    }

    /**
     * Substitute placeholders { key } using object with dot notation.
     * 
     * @param str 
     * @param data 
     * @param def 
     * @returns 
     */
    static substitute (
        str: string,
        data: Record<string, unknown> = {},
        def?: string
    ): string | undefined {
        if (!str || !data) return undefined
        const regex = /{\s*([a-zA-Z0-9_.]+)\s*}/g
        const flattened = dot(data)
        return str.replace(regex, (_, key: string) => {
            const value = flattened[key]
            return value !== undefined ? String(value) : def ?? ''
        })
    }

    /**
     * Convert the given string to upper-case.
     *
     * @param { string } value
     *
     * @return { string }
     */
    static upper (value: string): string {
        return value.toUpperCase()
    }

    /**
     * Convert the given string to title case.
     *
     * @param { string } value
     *
     * @return { string }
     */
    static title (value: string): string {
        return value.split(/[^A-Za-z]/)
            .map((word: string): string => this.ucfirst(word[0] + word.substring(1).toLowerCase()))
            .join(' ')
    }

    /**
     * Convert the given string to title case for each word.
     *
     * @param { string } value
     *
     * @return { string }
     */
    static headline (value: string): string {
        let parts: string[] = value.split(' ')

        parts = parts.length > 1
            ? parts.map((part: string): string => this.title(part))
            : this.ucsplit(parts.join('_')).map((part: string): string => this.title(part))

        const collapsed: string = this.replace(['-', '_', ' '], '_', parts.join('_'))

        return collapsed.split('_').join(' ').trim()
    }

    /**
     * Convert the given string to APA-style title case.
     *
     * @see https://apastyle.apa.org/style-grammar-guidelines/capitalization/title-case
     *
     * @param { string } value
     *
     * @return { string }
     */
    static apa (value: string): string {
        if (value === '') {
            return value
        }

        const minorWords: string[] = [
            'and', 'as', 'but', 'for', 'if', 'nor', 'or', 'so', 'yet', 'a', 'an',
            'the', 'at', 'by', 'for', 'in', 'of', 'off', 'on', 'per', 'to', 'up', 'via',
        ]

        const endPunctuation: string[] = ['.', '!', '?', ':', '—', ',']

        const words: string[] = value.split(/\s+/).filter(Boolean)

        words[0] = (words[0] as string).charAt(0).toUpperCase() + (words[0] as string).slice(1).toLowerCase()

        for (let i: number = 0; i < words.length; i++) {
            const lowercaseWord: string = (words[i] as string).toLowerCase()

            if (lowercaseWord.includes('-')) {
                let hyphenatedWords: string[] = lowercaseWord.split('-')

                hyphenatedWords = hyphenatedWords.map((part: string): string =>
                    (minorWords.includes(part) && part.length <= 3) ? part : this.ucfirst(part)
                )

                words[i] = hyphenatedWords.join('-')
            } else if (minorWords.includes(lowercaseWord) &&
                lowercaseWord.length <= 3 &&
                !(i === 0 || endPunctuation.includes((words[i - 1] as string).slice(-1)))) {
                words[i] = lowercaseWord
            } else {
                words[i] = this.ucfirst(lowercaseWord)
            }
        }

        return words.join(' ')
    }

    /**
     * Get the singular form of an English word.
     *
     * @param { string } value
     *
     * @return { string }
     */
    static singular (value: string): string {
        // List of rules for singular words.
        const singular: { [key: string]: string } = {
            // Special cases
            '^(.*)(menu)s$': '$1$2',
            '^tights$': 'tights',
            '^shorts$': 'shorts',
            '^glasses$': 'glasses',
            '^pants$': 'pants',

            // -us -> -i (second declension nouns)
            '(alumn|bacill|cact|foc|fung|nucle|radi|stimul|syllab|termin|viri?)i$': '$1us',
            '(vir)i$': '$1us',

            // -a -> -um/on (neuter nouns)
            '([ti])a$': '$1um',
            '([ti])a(?<!regatta)$': '$1um',
            '(tax)a$': '$1on',
            '(c)riteria$': '$1riterion',

            // -ices -> -ex/ix
            '(matr)ices$': '$1ix',
            '(vert|ind)ices$': '$1ex',

            // -oes -> -o
            '(buffal|her|potat|tomat|volcan)oes$': '$1o',

            // -ouses -> -ouse
            '(h|bl)ouses$': '$1ouse',
            'ouses$': 'ouse',

            // -ies -> -y
            '([^aeiouy]|qu)ies$': '$1y',

            // -ves -> -f/fe
            '([lr])ves$': '$1f',
            '([^fo])ves$': '$1fe',
            '(shea|loa|lea|thie)ves$': '$1f',
            '(li|wi|kni)ves$': '$1fe',

            // -es -> -is
            '(analys|ax|cris|test|thes)es$': '$1is',
            '(cris|ax|test)es$': '$1is',

            // -es exceptions
            '(alias|status|bus)es$': '$1',
            '(shoe|slave)s$': '$1',
            '(corpse)s$': '$1',
            '(drive|dive|hive|olive|tive)s$': '$1',

            // -xes
            '([ftw]ax)es': '$1',

            // -ices -> -ouse
            '([m|l])ice$': '$1ouse',

            // -es -> -e
            '(o)es$': '$1',
            '(x|ch|ss|sh)es$': '$1',

            // -zes -> -ze
            '(quiz)zes$': '$1',

            // -en -> - (oxen -> ox)
            '^(ox)en$': '$1',

            // -people -> -person
            '(p)eople$': '$1erson',

            // Irregular plurals
            '(m)en$': '$1an',
            '(c)hildren$': '$1hild',
            '(f)eet$': '$1oot',
            '(m)ice$': '$1ouse',
            '(t)eeth$': '$1ooth',
            '(g)eese$': '$1oose',

            // -news
            '(n)ews$': '$1ews',

            // -eau
            'eaus$': 'eau',

            // -ses -> -sis
            '(^analy)ses$': '$1sis',
            '((a)naly|(b)a|(d)iagno|(p)arenthe|(p)rogno|(s)ynop|(t)he)ses$': '$1$2sis',

            // -movies
            '(m)ovies$': '$1ovie',

            // -series
            '(s)eries$': '$1eries',

            // -us
            '([^a])uses$': '$1us',
            '(us)es$': '$1',

            // -status
            '(s)tatus(es)?$': '$1tatus',

            // -campus
            '(c)ampus$': '$1ampus',

            // General case
            's$': ''
        }

        // List of words that change irregularly.
        const irregular: { [key: string]: string } = {
            // A
            'abuses': 'abuse',
            'alumnae': 'alumna',
            'alumni': 'alumnus',
            'analyses': 'analysis',
            'appendices': 'appendix',
            'atlases': 'atlas',
            'avalanches': 'avalanche',
            'axes': 'axis',  // Also covers 'axe'

            // B
            'bacilli': 'bacillus',
            'bacteria': 'bacterium',
            'bases': 'basis',
            'beaux': 'beau',
            'beefs': 'beef',
            'blouses': 'blouse',
            'brothers': 'brother',
            'brownies': 'brownie',
            'bureaux': 'bureau',

            // C
            'caches': 'cache',
            'cacti': 'cactus',
            'cafes': 'cafe',
            'calves': 'calf',
            'canvases': 'canvas',
            'caves': 'cave',
            'chateaux': 'chateau',
            'children': 'child',
            'cookies': 'cookie',
            'corpuses': 'corpus',
            'cows': 'cow',
            'crises': 'crisis',
            'criteria': 'criterion',
            'curricula': 'curriculum',
            'curves': 'curve',

            // D
            'deer': 'deer',
            'demos': 'demo',
            'diagnoses': 'diagnosis',
            'dominoes': 'domino',

            // E
            'echoes': 'echo',
            'elves': 'elf',
            'ellipses': 'ellipsis',
            'emphases': 'emphasis',
            'epochs': 'epoch',

            // F
            'fish': 'fish',
            'foci': 'focus',
            'foes': 'foe',
            'feet': 'foot',
            'formulae': 'formula',
            'fungi': 'fungus',

            // G
            'ganglions': 'ganglion',
            'gases': 'gas',
            'genies': 'genie',
            'genera': 'genus',
            'geese': 'goose',
            'graffiti': 'graffito',
            'graves': 'grave',

            // H
            'halves': 'half',
            'hippopotami': 'hippopotamus',
            'hoaxes': 'hoax',
            'hoofs': 'hoof',  // Also acceptable: 'hooves'
            'humans': 'human',

            // I
            'irises': 'iris',

            // K
            'knives': 'knife',

            // L
            'larvae': 'larva',
            'leaves': 'leaf',
            'lenses': 'lens',
            'lives': 'life',
            'loaves': 'loaf',

            // M
            'men': 'man',
            'matrices': 'matrix',
            'means': 'means',
            'media': 'medium',
            'memoranda': 'memorandum',
            'monies': 'money',
            'mongooses': 'mongoose',
            'mice': 'mouse',
            'mottoes': 'motto',
            'moves': 'move',
            'mythoi': 'mythos',

            // N
            'nebulae': 'nebula',
            'neuroses': 'neurosis',
            'niches': 'niche',
            'niveaux': 'niveau',
            'nuclei': 'nucleus',
            'numina': 'numen',

            // O
            'oases': 'oasis',
            'occiputs': 'occiput',
            'octopuses': 'octopus',
            'offspring': 'offspring',
            'opuses': 'opus',
            'oxen': 'ox',

            // P
            'parentheses': 'parenthesis',
            'passersby': 'passerby',
            'penises': 'penis',
            'people': 'person',
            'phenomena': 'phenomenon',
            'plateaux': 'plateau',

            // R
            'radii': 'radius',
            'runners-up': 'runner-up',

            // S
            'safes': 'safe',
            'saves': 'save',
            'scarves': 'scarf',
            'selves': 'self',
            'series': 'series',
            'sexes': 'sex',
            'sheep': 'sheep',
            'shelves': 'shelf',
            'sieves': 'sieve',
            'soliloquies': 'soliloquy',
            'sons-in-law': 'son-in-law',
            'species': 'species',
            'stadiums': 'stadium',
            'stimuli': 'stimulus',
            'strata': 'stratum',
            'swine': 'swine',
            'syllabi': 'syllabus',
            'syntheses': 'synthesis',

            // T
            'testes': 'testis',
            'theses': 'thesis',
            'thieves': 'thief',
            'teeth': 'tooth',
            'tornadoes': 'tornado',
            'trilbys': 'trilby',
            'turfs': 'turf',  // Also acceptable: 'turves'

            // V
            'valves': 'valve',
            'volcanoes': 'volcano',

            // W
            'waves': 'wave',
            'wives': 'wife',
            'wolves': 'wolf',

            // Z
            'zombies': 'zombie'
        }

        // List of words that do not change.
        const uncountable: string[] = [
            // A
            'advice',
            'aircraft',
            'amoyese',
            'art',
            'audio',

            // B
            'baggage',
            'bison',
            'borghese',
            'bream',
            'breeches',
            'britches',
            'buffalo',
            'butter',

            // C
            'cantus',
            'carp',
            'cattle',
            'chassis',
            'clippers',
            'clothing',
            'coal',
            'cod',
            'coitus',
            'compensation',
            'congoese',
            'contretemps',
            'coreopsis',
            'corps',
            'cotton',

            // D
            'data',
            'debris',
            'deer',
            'diabetes',
            'djinn',

            // E
            'education',
            'eland',
            'elk',
            'emoji',
            'equipment',
            'evidence',

            // F
            'faroese',
            'feedback',
            'fish',
            'flounder',
            'flour',
            'foochowese',
            'food',
            'furniture',

            // G
            'gallows',
            'genevese',
            'genoese',
            'gilbertese',
            'gold',

            // H
            'headquarters',
            'herpes',
            'hijinks',
            'homework',
            'hovercraft',
            'hottentotese',

            // I
            'impatience',
            'information',
            'innings',

            // J
            'jackanapes',
            'jeans',
            'jedi',

            // K
            'kin',
            'kiplingese',
            'knowledge',
            'kongoese',

            // L
            'leather',
            'love',
            'lucchese',
            'luggage',

            // M
            'mackerel',
            'Maltese',
            'management',
            'metadata',
            'mews',
            'money',
            'moose',
            'mumps',
            'music',

            // N
            'nankingese',
            'news',
            'nexus',
            'niasese',
            'nutrition',

            // O
            'oil',
            'offspring',

            // P
            'patience',
            'pekingese',
            'piedmontese',
            'pike',
            'pincers',
            'pistoiese',
            'plankton',
            'pliers',
            'pokemon',
            'police',
            'polish',
            'portuguese',
            'proceedings',
            'progress',

            // Q
            // (none yet)

            // R
            'rabies',
            'rain',
            'research',
            'rhinoceros',
            'rice',

            // S
            'salmon',
            'sand',
            'sarawakese',
            'scissors',
            'sea[- ]bass',
            'series',
            'shavese',
            'shears',
            'sheep',
            'shrimp',
            'siemens',
            'silk',
            'sms',
            'soap',
            'social media',
            'spacecraft',
            'spam',
            'species',
            'staff',
            'sugar',
            'swine',

            // T
            'talent',
            'toothpaste',
            'traffic',
            'travel',
            'trousers',
            'trout',
            'tuna',

            // U
            'us',

            // V
            'vermontese',
            'vinegar',

            // W
            'weather',
            'wenchowese',
            'wheat',
            'whiting',
            'wildebeest',
            'wood',
            'wool',

            // Y
            'yengeese',
            'you'
        ]

        if (uncountable.indexOf(value.toLowerCase()) >= 0) {
            return matchCase(value, value)
        }

        for (const word in irregular) {
            const pattern: RegExp = new RegExp(`${word}$`, 'i')

            if (pattern.test(value)) {
                return matchCase(value.replace(pattern, (irregular[word] as string)), value)
            }
        }

        for (const word in singular) {
            const pattern: RegExp = new RegExp(word, 'i')

            if (pattern.test(value)) {
                return matchCase(value.replace(pattern, (singular[word] as string)), value)
            }
        }

        return matchCase(value, value)
    }

    /**
     * Get the singular form of an English word.
     *
     * @param { string } value
     * 
     * @alias singular
     *
     * @return { string }
     */
    static singularize (value: string): string {
        return this.singular(value)
    }

    /**
     * Generate a URL friendly "slug" from a given string.
     *
     * @param { string } title
     * @param { string } separator
     * @param { object } dictionary
     *
     * @return { string }
     */
    static slug (title: string, separator: string = '-', dictionary: { [key: string]: string } = { '@': 'at' }): string {
        const flip: string = separator === '-' ? '_' : '-'

        title = title.replace(`![${preg_quote(flip)}]+!u`, separator)

        for (const value in dictionary) {
            dictionary[value] = separator + dictionary[value] + separator
        }

        for (const value in dictionary) {
            title = title.replaceAll(value, (dictionary[value] as string))
        }

        title = this.lower(title).replace(`![^${preg_quote(separator)}pLpNs]+!u`, '')

        return title.replaceAll(/\s|!/g, separator).replace(new RegExp('\\' + separator + '+', 'g'), separator)
    }

    /**
     * Generate a URL friendly "slug" from a given string.
     *
     * @param { string } separator
     * @param { string } title
     * @param { object } dictionary
     * 
     * @alias singular
     *
     * @return { string }
     */
    static slugify (title: string, separator: string = '-', dictionary: { [key: string]: string } = { '@': 'at' }): string {
        return this.slug(title, separator, dictionary)
    }

    /**
     * Convert a string to snake case.
     *
     * @param { string } value
     * @param { string } delimiter
     *
     * @return { string }
     */
    static snake (value: string, delimiter: string = '_'): string {
        value = ucwords(value).replace(new RegExp(/\s+/, 'u'), '')

        value = this.lower(value.replace(new RegExp(/(.)(?=[A-Z])/, 'ug'), `$1${delimiter}`))

        return value
    }

    /**
     * Uppercase the first character of each word in a string
     *
     * @param { string } string The input string.
     * @param { string } separators The optional separators contains the word separator characters.
    
     * @return { string } String the modified string.
     */
    static capitalize (string: string, separators: string = ' \t\r\n\f\v'): string {
        return ucwords(string, separators)
    }

    /**
     * Uppercase the first character of each word in a string
     *
     * @param { string } string The input string.
     * @param { string } separators The optional separators contains the word separator characters.
    
     * @return { string } String the modified string.
     */
    static ucwords (string: string, separators: string = ' \t\r\n\f\v'): string {
        return ucwords(string, separators)
    }

    /**
     * Remove all whitespace from both ends of a string.
     *
     * @param { string } value
     * @param { string | null } characters
     *
     * @return { string }
     */
    static trim (value: string, characters: string | null = null): string {
        // Default whitespace trim
        if (characters === null) {
            return value.trim()
        }

        // Nothing to trim
        if (characters === '') {
            return value
        }

        // Trim start
        for (const char of characters) {
            while (value.startsWith(char)) {
                value = value.substring(char.length)
            }
        }

        // Trim end
        for (const char of characters) {
            while (value.endsWith(char)) {
                value = value.substring(0, value.length - char.length)
            }
        }

        return value
    }

    /**
     * Remove all whitespace from the beginning of a string.
     *
     * @param { string } value
     * @param { string | null } characters
     *
     * @return { string }
     */
    static ltrim (value: string, characters: string | null = null): string {
        // Trim default whitespace if no custom characters are provided
        if (characters === null) {
            return value.trimStart()
        }

        // No characters to trim
        if (characters === '') {
            return value
        }

        // Loop through each character and strip it ONLY from the start
        for (const char of characters) {
            while (value.startsWith(char)) {
                value = value.substring(char.length)
            }
        }

        return value
    }

    /**
     * Remove all whitespace from the end of a string.
     *
     * @param { string } value
     * @param { string | null } characters
     *
     * @return { string }
     */
    static rtrim (value: string, characters: string | null = null): string {
        // Trim default whitespace if no custom characters are provided
        if (characters === null) {
            return value.trimEnd()
        }

        // No characters to trim
        if (characters === '') {
            return value
        }

        // Loop through each character and strip it ONLY from the end
        for (const char of characters) {
            while (value.endsWith(char)) {
                value = value.substring(0, value.length - char.length)
            }
        }

        return value
    }


    /**
     * Remove all "extra" blank space from the given string.
     *
     * @param { string } value
     *
     * @return { string }
     */
    static squish (value: string): string {
        return value.replace(/\s\s+/g, ' ').trim()
    }

    /**
     * Determine if a given string starts with a given substring.
     *
     * @param { string } haystack
     * @param { string | string[] } needles
     *
     * @return { boolean }
     */
    static startsWith (haystack: string, needles: string | string[]): boolean {
        let result: boolean = false

        needles = Array.isArray(needles) ? needles : [needles]

        needles.forEach((needle: string): void => {
            if (needle !== '' && haystack.startsWith(needle)) {
                result = true
            }
        })

        return result
    }

    /**
     * Determine if a given string doesn't start with a given substring.
     *
     * @param { string } haystack
     * @param { string | string[] } needles
     *
     * @return { boolean }
     */
    static doesntStartWith (haystack: string, needles: string | string[]): boolean {
        return !this.startsWith(haystack, needles)
    }

    /**
     * Convert a value to studly caps case.
     *
     * @param { string } value
     *
     * @return { string }
     */
    static studly (value: string): string {
        const words: string[] = this.replace(['-', '_'], ' ', value).split(' ')

        const studlyWords: string[] = words.map((word: string): string => this.ucfirst(word))

        return studlyWords.join('')
    }

    /**
     * Convert a value to Pascal case.
     *
     * @param { string } value
     *
     * @return { string }
     */
    static pascal (value: string): string {
        return this.studly(value)
    }

    /**
     * Returns the portion of the string specified by the start and length parameters.
     *
     * @param { string } string
     * @param { number } start
     * @param { number | null } length
     *
     * @return { string }
     */
    static substr (string: string, start: number, length: number | null = null): string {
        string = string.replace(/<[^>]+>/g, '')

        if (start < 0) {
            start = string.length + start

            if (start < 0) {
                start = 0
            }
        }

        if (length !== null && length < 0) {
            return ''
        }

        if (length === 0 || length === null) {
            return string.substring(start, length ?? string.length)
        }

        return string.substring(start, start + length)
    }

    /**
     * Returns the number of substring occurrences.
     *
     * @param { string } haystack
     * @param { string } needle
     * @param { number } offset
     * @param { number | null } length
     *
     * @return { number }
     */
    static substrCount (haystack: string, needle: string, offset: number = 0, length: number | null = null): number {
        if (length) {
            return haystack.substring(offset).substring(0, length).split(needle).length - 1
        }

        return haystack.substring(offset).split(needle).length - 1
    }

    /**
     * Replace text within a portion of a string.
     *
     * @param { string } string
     * @param { string } replace
     * @param { number } offset
     * @param { number | null } length
     *
     * @return { string }
     */
    static substrReplace (string: string, replace: string, offset: number = 0, length: number | null = null): string {
        if (length !== null) {
            return string.substring(0, offset) + replace + string.substring(offset)
        }

        return string.substring(0, offset) + replace
    }

    /**
     * Swap multiple keywords in a string with other keywords.
     *
     * @param { object } map
     * @param { string } subject
     *
     * @return { string }
     */
    static swap (map: Record<string, string>, subject: string): string {
        for (const value in map) {
            subject = subject.replace(value, (map[value] as string))
        }

        return subject
    }

    /**
     * Take the first or last {limit} characters of a string.
     *
     * @param { string } string
     * @param { number } limit
     *
     * @return { string }
     */
    static take (string: string, limit: number): string {
        if (limit < 0) {
            return this.substr(string, limit)
        }

        return this.substr(string, 0, limit)
    }

    /**
     * Convert the given string to Base64 encoding.
     *
     * @param { string } string
     *
     * @return { string }
     */
    static toBase64 (string: string): string {
        return btoa(string)
    }

    /**
     * Decode the given Base64 encoded string.
     *
     * @param { string } string
     *
     * @return { string }
     */
    static fromBase64 (string: string): string {
        return atob(string)
    }

    /**
     * Checks if a string is numeric
     * 
     * @param string 
     * @returns 
     */
    static isNumber (string: string): boolean {
        return !isNaN(Number(string)) && string.trim() !== ''
    }

    /**
     * Checks if a string is an integer
     * 
     * @param string 
     * @returns 
     */
    static isInteger (string: string): boolean {
        return Number.isInteger(Number(string)) && string.trim() !== ''
    }

    /**
     * ROT-N cipher.
     * 
     * @param string 
     * @param n 
     * @returns 
     */
    static rot (string: string, n: number = 13): string {
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

    /**
     * Replace trailing punctuation with new format.
     * 
     * @param string 
     * @param newFormat 
     * @returns 
     */
    static replacePunctuation (string: string, newFormat: string): string {
        return string.replace(/[.,;:!?]*$/, '') + newFormat
    }

    /**
     * Array/object driven text replacement.
     * 
     * @param string 
     * @param replacements 
     * @returns 
     */
    static translate (string: string, replacements: Record<string, string> | Array<[string, string]>): string {
        let result = string
        if (Array.isArray(replacements)) {
            for (const [from, to] of replacements) result = result.replace(new RegExp(from, 'g'), to)
        } else {
            for (const [from, to] of Object.entries(replacements)) result = result.replace(new RegExp(from, 'g'), to)
        }
        return result
    }

    /**
     * Strip slashes recursively.
     * 
     * @param string 
     * @returns 
     */
    static ss (string: string): string {
        return string.replace(/\\(.)/g, '$1')
    }

    /**
     * First and last N lines.
     * 
     * @param string 
     * @param amount 
     * @returns 
     */
    static firstLines (string: string, amount: number = 1): string {
        return string.split('\n').slice(0, amount).join('\n')
    }

    /**
     * Last and first N lines.
     * 
     * @param string 
     * @param amount 
     * @returns 
     */
    static lastLines (string: string, amount: number = 1): string {
        return string.split('\n').slice(-amount).join('\n')
    }

    /**
     * Make a string's first character lowercase.
     *
     * @param { string } string
     *
     * @return { string }
     */
    static lcfirst (string: string): string {
        return this.lower(this.substr(string, 0, 1)) + this.substr(string, 1, string.length)
    }

    /**
     * Make a string's first character uppercase.
     *
     * @param { string } string
     *
     * @return { string }
     */
    static ucfirst (string: string): string {
        return this.upper(this.substr(string, 0, 1)) + this.substr(string, 1, string.length)
    }

    /**
     * Split a string into pieces by uppercase characters.
     *
     * @param { string } string
     *
     * @return { string[] }
     */
    static ucsplit (string: string): string[] {
        return string.split(new RegExp(/(?=\p{Lu})/u))
    }

    /**
     * Get the number of words a string contains.
     *
     * @param { string } string
     *
     * @return { number }
     */
    static wordCount (string: string): number {
        return string.split(/\s+/).length
    }

    /**
     * Wrap a string to a given number of characters.
     *
     * @param { string } string
     * @param { number } characters
     * @param { string } breakStr
     * @param { boolean } cutLongWords
     *
     * @returns { string }
     */
    static wordWrap (string: string, characters: number = 75, breakStr: string = '\n', cutLongWords: boolean = false): string {
        const breakWithSpace: string = cutLongWords ? breakStr + '\u00ad' : breakStr
        const regex: RegExp = new RegExp(`.{1,${characters}}`, 'g')
        const result: string = string.replace(regex, (substr: string): string => substr.trim() + breakWithSpace)

        return this.replaceLast(breakStr, '', result)
    }

    /**
     * Generate a UUID (version 4).
     *
     * @return { string }
     */
    static uuid (): string {
        if (this.uuidFactory !== null) {
            return this.uuidFactory()
        }

        let time: number = parseInt((Math.random() * Number.MAX_SAFE_INTEGER + 1).toString().substring(0, 13))

        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (character: string): string {
            const randomChar: number = (time + Math.random() * 16) % 16 | 0
            time = Math.floor(time / 16)

            return (character === 'x' ? randomChar : (randomChar & 0x3 | 0x8)).toString(16)
        })
    }

    /**
     * Generate a UUID (version 7).
     *
     * @return { string }
     */
    static uuid7 (time: Date | null = null): string {
        if (this.uuidFactory !== null) {
            return this.uuidFactory()
        }

        const values = new Uint32Array(3)

        crypto.getRandomValues(values)

        const timestamp: number = time ? time.getTime() : Date.now()

        if (timestamp < 0 || timestamp > 281474976710655) {
            throw new RangeError('Timestamp must be a 48-bit positive integer')
        }

        const [r1, r2, r3] = values

        const randomA: number = (r1 as number) & 0xfff
        const randomBHi: number = (r2 as number) & 0x3fffffff
        const randomBLo: number = r3 as number

        const bytes = new Uint8Array(16)

        bytes[0] = timestamp / 2 ** 40
        bytes[1] = timestamp / 2 ** 32
        bytes[2] = timestamp / 2 ** 24
        bytes[3] = timestamp / 2 ** 16
        bytes[4] = timestamp / 2 ** 8
        bytes[5] = timestamp
        bytes[6] = 0x70 | (randomA >>> 8)
        bytes[7] = randomA
        bytes[8] = 0x80 | (randomBHi >>> 24)
        bytes[9] = randomBHi >>> 16
        bytes[10] = randomBHi >>> 8
        bytes[11] = randomBHi
        bytes[12] = randomBLo >>> 24
        bytes[13] = randomBLo >>> 16
        bytes[14] = randomBLo >>> 8
        bytes[15] = randomBLo

        const digits = '0123456789abcdef'

        let result: string = ''

        for (let i: number = 0; i < 16; i++) {
            result += digits.charAt(bytes[i]! >>> 4)
            result += digits.charAt(bytes[i]! & 0xf)

            if (i === 3 || i === 5 || i === 7 || i === 9) {
                result += '-'
            }
        }

        return result
    }

    /**
     * Validate an IP address
     * 
     * @param host 
     * @param type 
     * 
     * @return { boolean }
     */
    static validateIp (host: string, type?: 'ipv4' | 'ipv6'): boolean {
        const code = {
            ipv4: 4,
            ipv6: 6,
        } as const

        const result = isIP(host)

        if (type)
            return result === code[type]

        return result > 0
    }

    /**
     * Generate a time-ordered UUID (version 4).
     *
     * @return { string }
     */
    static orderedUuid (): string {
        if (this.uuidFactory !== null) {
            return this.uuidFactory()
        }

        let time: number = new Date().getTime()

        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (character: string): string {
            const randomChar: number = (time + Math.random() * 16) % 16 | 0
            time = Math.floor(time / 16)

            return (character === 'x' ? randomChar : (randomChar & 0x3 | 0x8)).toString(16)
        })
    }

    /**
     * Set the callable that will be used to generate UUIDs.
     *
     * @param { Function | null } factory
     *
     * @return { void }
     */
    static createUuidsUsing (factory: Function | null = null): void {
        this.uuidFactory = factory
    }

    /**
     * Set the sequence that will be used to generate random strings.
     *
     * @param { (string | undefined)[] } sequence
     * @param { Function | null } whenMissing
     *
     * @return { void }
     */
    static createUuidsUsingSequence (sequence: (string | undefined)[], whenMissing: Function | null = null): void {
        let next: number = 0

        whenMissing ??= (): string => {
            const factoryCache: Function | null = this.uuidFactory

            this.uuidFactory = null

            const uuid: string = this.uuid()

            this.uuidFactory = factoryCache

            next++

            return uuid
        }

        this.createUuidsUsing(() => {
            if (sequence[next] !== undefined) {
                return sequence[next++]
            }

            return whenMissing()
        })
    }

    /**
     * Always return the same UUID when generating new UUIDs.
     *
     * @param { Function | null } callback
     *
     * @return { string }
     */
    static freezeUuids (callback: Function | null = null): string {
        const uuid: string = this.uuid()

        this.createUuidsUsing((): string => uuid)

        if (callback !== null) {
            try {
                callback(uuid)
            } finally {
                this.createUuidsNormally()
            }
        }

        return uuid
    }

    /**
     * Indicate that UUIDs should be created normally and not using a custom factory.
     *
     * @return { void }
     */
    static createUuidsNormally (): void {
        this.uuidFactory = null
    }

    /**
     * Generate a ULID.
     *
     * @return { string }
     */
    static ulid (): string {
        if (this.ulidFactory !== null) {
            return this.ulidFactory()
        }

        const encoding: string = '0123456789ABCDEFGHJKMNPQRSTVWXYZ'
        const encodingLength: number = encoding.length
        const timeLength: number = 10
        const randomLength: number = 16

        /**
         * Generate random Encoding Time.
         *
         * @return { string }
         */
        function generateEncodedTime (): string {
            let encodedTime: string = ''
            let now: number = new Date().getTime()

            for (let length: number = timeLength; length > 0; length--) {
                const mod: number = now % encodingLength
                encodedTime = encoding.charAt(mod) + encodedTime
                now = (now - mod) / encodingLength
            }

            return encodedTime
        }

        /**
         * Generate random Number.
         *
         * @return { number }
         */
        function generateRandomNumber (): number {
            const buffer: Uint8Array = new Uint8Array(1)

            crypto.getRandomValues(buffer)

            return (buffer[0] as number) / 0xff
        }

        /**
         * Generate random String.
         *
         * @return { string }
         */
        function generateRandomString (): string {
            let string: string = ''

            for (let length: number = randomLength; length > 0; length--) {
                let randomNumber: number = Math.floor(generateRandomNumber() * encodingLength)

                if (randomNumber === encodingLength) {
                    randomNumber = encodingLength - 1
                }

                string += encoding.charAt(randomNumber)
            }

            return string
        }

        return generateEncodedTime() + generateRandomString()
    }

    /**
     * Set the callable that will be used to generate ULIDs.
     *
     * @param { Function | null } factory
     *
     * @return { void }
     */
    static createUlidsUsing (factory: Function | null = null): void {
        this.ulidFactory = factory
    }

    /**
     * Set the sequence that will be used to generate ULIDs.
     *
     * @param { (string | undefined)[] } sequence
     * @param { Function | null } whenMissing
     *
     * @return { void }
     */
    static createUlidsUsingSequence (sequence: (string | undefined)[], whenMissing: Function | null = null): void {
        let next: number = 0

        whenMissing ??= (): string => {
            const factoryCache: Function | null = this.ulidFactory

            this.ulidFactory = null

            const ulid: string = this.ulid()

            this.ulidFactory = factoryCache

            next++

            return ulid
        }

        this.createUlidsUsing(() => {
            if (sequence[next] !== undefined) {
                return sequence[next++]
            }

            return whenMissing()
        })
    }

    /**
     * Always return the same UUID when generating new UUIDs.
     *
     * @param { Function | null } callback
     *
     * @return { string }
     */
    static freezeUlids (callback: Function | null = null): string {
        const ulid: string = this.ulid()

        this.createUlidsUsing(() => ulid)

        if (callback !== null) {
            try {
                callback(ulid)
            } finally {
                this.createUlidsNormally()
            }
        }

        return ulid
    }

    /**
     * Indicate that ULIDs should be created normally and not using a custom factory.
     *
     * @return { void }
     */
    static createUlidsNormally (): void {
        this.ulidFactory = null
    }
}

export class Stringable {
    /**
     * The underlying string value.
     *
     * @private
     *
     * @type { string }
     */
    readonly #value: string

    /**
     * Create a new instance of the class.
     *
     * @param { string } value
     */
    constructor(value: string = '') {
        this.#value = value
    }

    /**
     * Return the remainder of a string after the first occurrence of a given value.
     *
     * @param { string } search
     *
     * @return { Stringable }
     */
    after (search: string): Stringable {
        return new Stringable(Str.after(this.#value, search))
    }

    /**
     * Return the remainder of a string after the last occurrence of a given value.
     *
     * @param { string } search
     *
     * @return { Stringable }
     */
    afterLast (search: string): Stringable {
        return new Stringable(Str.afterLast(this.#value, search))
    }

    /**
     * Append the given values to the string.
     *
     * @param { string | string[] } values
     *
     * @return { Stringable }
     */
    append (...values: string[]): Stringable {
        return new Stringable(this.#value + values.join(''))
    }

    /**
     * Append a new line to the string.
     *
     * @param { number } count
     *
     * @return { Stringable }
     */
    newLine (count: number = 1): Stringable {
        return this.append('\n'.repeat(count))
    }

    /**
     * Transliterate a UTF-8 value to ASCII.
     *
     * @return { Stringable }
     */
    ascii (): Stringable {
        return new Stringable(Str.ascii(this.#value))
    }

    /**
     * Get the trailing name component of the path.
     *
     * @param { string } suffix
     *
     * @return { Stringable }
     */
    basename (suffix: string = ''): Stringable {
        let basename: string = this.#value

        if (this.#value.split('/')[0] !== this.#value) {
            basename = (this.#value.split('/').pop() as string)
        }

        if (this.#value.split('\\')[0] !== this.#value) {
            basename = (this.#value.split('\\').pop() as string)
        }

        if (suffix !== '') {
            basename = basename.replace(suffix, '')
        }

        return new Stringable(basename)
    }

    /**
     * Get the character at the specified index.
     *
     * @param { number } index
     *
     * @return { string | false }
     */
    charAt (index: number): string | false {
        return Str.charAt(this.#value, index)
    }

    /**
     * Remove the given string if it exists at the start of the current string.
     *
     * @param { string | string[] }  needle
     *
     * @return { Stringable }
     */
    chopStart (needle: string | string[]): Stringable {
        return new Stringable(Str.chopStart(this.#value, needle))
    }

    /**
     * Remove the given string if it exists at the end of the current string.
     *
     * @param { string | string[] }  needle
     *
     * @return { Stringable }
     */
    chopEnd (needle: string | string[]): Stringable {
        return new Stringable(Str.chopEnd(this.#value, needle))
    }

    /**
     * Get the basename of the class path.
     *
     * @return { Stringable }
     */
    classBasename (): Stringable {
        return this.basename()
    }

    /**
     * Get the portion of a string before the first occurrence of a given value.
     *
     * @param { string } search
     *
     * @return { Stringable }
     */
    before (search: string): Stringable {
        return new Stringable(Str.before(this.#value, search))
    }

    /**
     * Get the portion of a string before the last occurrence of a given value.
     *
     * @param { string } search
     *
     * @return { Stringable }
     */
    beforeLast (search: string): Stringable {
        return new Stringable(Str.beforeLast(this.#value, search))
    }

    /**
     * Get the portion of a string between two given values.
     *
     * @param { string } from
     * @param { string } to
     *
     * @return { Stringable }
     */
    between (from: string, to: string): Stringable {
        return new Stringable(Str.between(this.#value, from, to))
    }

    /**
     * Get the smallest possible portion of a string between two given values.
     *
     * @param { string } from
     * @param { string } to
     *
     * @return { Stringable }
     */
    betweenFirst (from: string, to: string): Stringable {
        return new Stringable(Str.betweenFirst(this.#value, from, to))
    }

    /**
     * Convert a value to camel case.
     *
     * @return { Stringable }
     */
    camel (): Stringable {
        return new Stringable(Str.camel(this.#value))
    }

    /**
     * Determine if a given string contains a given substring.
     *
     * @param  { string | string[] } needles
     * @param  { boolean } ignoreCase
     *
     * @return { boolean }
     */
    contains (needles: string | string[], ignoreCase: boolean = false): boolean {
        return Str.contains(this.#value, needles, ignoreCase)
    }

    /**
     * Determine if a given string contains all array values.
     *
     * @param { string[] } needles
     * @param { boolean } ignoreCase
     *
     * @return { boolean }
     */
    containsAll (needles: string[], ignoreCase: boolean = false): boolean {
        return Str.containsAll(this.#value, needles, ignoreCase)
    }

    /**
     * Convert the case of a string.
     *
     * @param { Mode | number } mode
     *
     * @return { Stringable }
     */
    convertCase (mode: Mode | number = Mode.MB_CASE_FOLD): Stringable {
        return new Stringable(Str.convertCase(this.#value, mode))
    }

    /**
     * Determine if a given string doesn't contain a given substring.
     *
     * @param  { string | string[] } needles
     * @param  { boolean } ignoreCase
     *
     * @return { boolean }
     */
    doesntContain (needles: string | string[], ignoreCase: boolean = false): boolean {
        return !this.contains(needles, ignoreCase)
    }

    /**
     * Detect content type
     * 
     * @param content 
     * @returns 
     */
    static detectContentType (content: any) {
        return Str.detectContentType(content)
    }

    /**
     * Replace consecutive instances of a given character with a single character in the given string.
     *
     * @param { string | string[] } characters
     *
     * @return { string }
     */
    deduplicate (characters: string | string[] = ' '): Stringable {
        return new Stringable(Str.deduplicate(this.#value, characters))
    }

    /**
     * Get the parent directory's path.
     *
     * @param { number } levels
     *
     * @return { Stringable }
     */
    dirname (levels: number = 1): Stringable {
        let dirname: string = this.#value
        let parts: string[] = []
        let isValidDirname: boolean = false
        let hasValidLevels: boolean = false

        if (this.#value.split('/')[0] !== this.#value) {
            parts = this.#value.split('/')
            dirname = parts.slice(0, parts.length - levels).join('/')
            isValidDirname = true
            hasValidLevels = parts.length <= levels + 1
        }

        if (this.#value.split('\\')[0] !== this.#value) {
            parts = this.#value.split('\\')
            dirname = parts.slice(0, parts.length - levels).join('\\')
            isValidDirname = true
            hasValidLevels = parts.length <= levels + 1
        }

        if (!isValidDirname) {
            dirname = '.'
        }

        if (isValidDirname && hasValidLevels) {
            dirname = '\\'
        }

        return new Stringable(dirname)
    }

    /**
     * Determine if a given string ends with a given substring.
     *
     * @param { string | string[] } needles
     *
     * @return { boolean }
     */
    endsWith (needles: string | string[]): boolean {
        return Str.endsWith(this.#value, needles)
    }

    /**
     * Determine if a given string doesn't end with a given substring.
     *
     * @param { string | string[] } needles
     *
     * @return { boolean }
     */
    doesntEndWith (needles: string | string[]): boolean {
        return !this.endsWith(needles)
    }

    /**
     * Returns all the characters except the last.
     * 
     * @returns 
     */
    chop () {
        return new Stringable(Str.chop(this.#value))
    }

    /**
     * Escape string for JSON encoding (returns string without quotes). 
     * 
     * @param string 
     * @returns 
     */
    esc (): Stringable {
        return new Stringable(Str.esc(this.#value))
    }

    /**
     * Determine if the string is an exact match with the given value.
     *
     * @param { Stringable | string } value
     *
     * @return { boolean }
     */
    exactly (value: Stringable | string): boolean {
        if (value instanceof Stringable) {
            value = value.toString()
        }

        return this.#value === value
    }

    /**
     * Extracts an excerpt from text that matches the first instance of a phrase.
     *
     * @param { string } phrase
     * @param { ExcerptOptions } options
     *
     * @return { string | null }
     */
    excerpt (phrase: string = '', options: ExcerptOptions = {}): string | null {
        return Str.excerpt(this.#value, phrase, options)
    }

    /**
     * Explode the string into an array.
     *
     * @param { string } delimiter
     * @param { number } limit
     *
     * @return { string[] }
     */
    explode (delimiter: string, limit: number = 0): string[] {
        return Str.explode(this.#value, delimiter, limit)
    }

    /**
     * Split a string using a regular expression or by length.
     *
     * @param { string } pattern
     * @param { number } limit
     *
     * @return { string[] }
     */
    split (pattern: string, limit: number = -1): string[] {
        const body: string = RegExpString.make(/^\/(.*)\/\w*$/, pattern)
        const flags: string = RegExpString.make(/^\/.*\/(\w*)$/, pattern)
        const expression: RegExp = new RegExp(body, flags + (flags.indexOf('g') !== -1 ? '' : 'g'))

        let segments: string[] = this.#value.split(expression)

        if (limit !== -1) {
            const position: number = limit - 1 >= segments.length
                ? segments.length - 1
                : limit - 1

            segments = [...segments.slice(0, position), segments.splice(position).join('')]
        }

        return segments.map((segment: string): string => segment.trim()) ?? []
    }

    /**
     * Cap a string with a single instance of a given value.
     *
     * @param { string } cap
     *
     * @return { Stringable }
     */
    finish (cap: string): Stringable {
        return new Stringable(Str.finish(this.#value, cap))
    }

    /**
     * Determine if a given string matches a given pattern.
     *
     * @param { string | string[] } pattern
     * @param { boolean } ignoreCase
     *
     * @return { boolean }
     */
    is (pattern: string | string[], ignoreCase: boolean = false): boolean {
        return Str.is(pattern, this.#value, ignoreCase)
    }

    /**
     * Determine if a given string is 7-bit ASCII.
     *
     * @return { boolean }
     */
    isAscii (): boolean {
        return Str.isAscii(this.#value)
    }

    /**
     * Determine if a given string is valid JSON.
     *
     * @return { boolean }
     */
    isJson (): boolean {
        return Str.isJson(this.#value)
    }

    /**
     * Determine if a given value is a valid URL.
     *
     * @return { boolean }
     */
    isUrl (): boolean {
        return Str.isUrl(this.#value)
    }

    /**
     * Determine if a given string is a valid UUID.
     *
     * @return { boolean }
     */
    isUuid (): boolean {
        return Str.isUuid(this.#value)
    }

    /**
     * Determine if a given string is a valid ULID.
     *
     * @return { boolean }
     */
    isUlid (): boolean {
        return Str.isUlid(this.#value)
    }

    /**
     * Determine if the given string is empty.
     *
     * @return { boolean }
     */
    isEmpty (): boolean {
        return this.#value.trim() === ''
    }

    /**
     * Determine if the given string is not empty.
     *
     * @return { boolean }
     */
    isNotEmpty (): boolean {
        return !this.isEmpty()
    }

    /**
     * Convert a string to kebab case.
     *
     * @return { Stringable }
     */
    kebab (): Stringable {
        return new Stringable(Str.kebab(this.#value))
    }

    /**
     * Return the length of the given string.
     *
     * @return { number }
     */
    length (): number {
        return Str.length(this.#value)
    }

    /**
     * Limit the number of characters in a string.
     *
     * @param { number } limit
     * @param { string } end
     * @param { boolean } preserveWords
     *
     * @return { Stringable }
     */
    limit (limit: number = 100, end: string = '...', preserveWords: boolean = false): Stringable {
        return new Stringable(Str.limit(this.#value, limit, end, preserveWords))
    }

    /**
     * Get substring by start/stop indexes.
     * 
     * @param start 
     * @param stop 
     * @returns 
     */
    sub (start: number, stop: number): Stringable {
        return new Stringable(Str.sub(this.#value, start, stop))
    }

    /**
     * Limit the number of characters in a string.
     *
     * @param { number } limit
     * @param { string } end
     * @param { boolean } preserveWords
     * 
     * @alias limit
     *
     * @return { Stringable }
     */
    truncate (
        limit: number = 100, end: string = '...', preserveWords: boolean = false
    ): Stringable {
        return new Stringable(Str.limit(this.#value, limit, end, preserveWords))
    }

    /**
     * Convert the given string to lower-case.
     *
     * @return { Stringable }
     */
    lower (): Stringable {
        return new Stringable(Str.lower(this.#value))
    }

    /**
     * Masks a portion of a string with a repeated character.
     *
     * @param { string } character
     * @param { number } index
     * @param { number | null }length
     *
     * @return { Stringable }
     */
    mask (character: string, index: number, length: number | null = null): Stringable {
        return new Stringable(Str.mask(this.#value, character, index, length))
    }

    /**
     * Get the string matching the given pattern.
     *
     * @param { string } pattern
     *
     * @return { Stringable }
     */
    match (pattern: string): Stringable {
        return new Stringable(Str.match(pattern, this.#value))
    }

    /**
     * Determine if a given string matches a given pattern.
     *
     * @param { string | string[] } pattern
     *
     * @return { boolean }
     */
    isMatch (...pattern: string[]): boolean {
        return Str.isMatch(pattern, this.#value)
    }

    /**
     * Get the string matching the given pattern.
     *
     * @param { string } pattern
     *
     * @return { string[] }
     */
    matchAll (pattern: string): string[] {
        return Str.matchAll(pattern, this.#value)
    }

    /**
     * Determine if the string matches the given pattern.
     *
     * @param { string } pattern
     *
     * @return { boolean }
     */
    test (pattern: string): boolean {
        return this.match(pattern).isNotEmpty()
    }

    /**
     * Remove all non-numeric characters from a string.
     *
     * @return { Stringable }
     */
    numbers (): Stringable {
        return new Stringable(Str.numbers(this.#value))
    }

    /**
     * Pad both sides of the string with another.
     *
     * @param { number } length
     * @param { string } pad
     *
     * @return { Stringable }
     */
    padBoth (length: number, pad: string = ' '): Stringable {
        return new Stringable(Str.padBoth(this.#value, length, pad))
    }

    /**
     * Pad the left side of the string with another.
     *
     * @param { number } length
     * @param { string } pad
     *
     * @return { Stringable }
     */
    padLeft (length: number, pad: string = ' '): Stringable {
        return new Stringable(Str.padLeft(this.#value, length, pad))
    }

    /**
     * Pad the right side of the string with another.
     *
     * @param { number } length
     * @param { string } pad
     *
     * @return { Stringable }
     */
    padRight (length: number, pad: string = ' '): Stringable {
        return new Stringable(Str.padRight(this.#value, length, pad))
    }

    /**
     * Call the given callback and return a new string.
     *
     * @param { keyof string | ((instance: this) => any) } callback
     *
     * @return { Stringable }
     */
    pipe (callback: keyof string | ((instance: this) => any)): Stringable {
        if (typeof callback === 'string') {
            if ((this.#value as any)[callback] instanceof Function) {
                return new Stringable((this.#value as any)[callback]())
            }
        }

        return new Stringable((callback as (instance: this) => any)(this).toString())
    }

    /**
     * Get the plural form of an English word.
     *
     * @param { number } count
     *
     * @return { Stringable }
     */
    plural (count: number = 2): Stringable {
        return new Stringable(Str.plural(this.#value, count))
    }

    /**
     * Pluralize the last word of an English, studly caps case string.
     *
     * @param { number } count
     *
     * @return { Stringable }
     */
    pluralStudly (count: number = 2): Stringable {
        return new Stringable(Str.pluralStudly(this.#value, count))
    }

    /**
     * Pluralize the last word of an English, Pascal case string.
     *
     * @param { number } count
     *
     * @return { Stringable }
     */
    pluralPascal (count: number = 2): Stringable {
        return new Stringable(Str.pluralPascal(this.#value, count))
    }

    /**
     * Find the multibyte safe position of the first occurrence of the given substring.
     *
     * @param { string } needle
     * @param { number } offset
     *
     * @return { number | false }
     */
    position (needle: string, offset: number = 0): number | false {
        return Str.position(this.#value, needle, offset)
    }

    /**
     * Prepend the given values to the string.
     *
     * @param { string | string[] } values
     *
     * @return { Stringable }
     */
    prepend (...values: string[]): Stringable {
        return new Stringable(values.join('') + this.#value)
    }

    /**
     * Remove any occurrence of the given string in the subject.
     *
     * @param { string } search
     * @param { boolean } caseSensitive
     *
     * @return { Stringable }
     */
    remove (search: string, caseSensitive: boolean = true): Stringable {
        return new Stringable(Str.remove(search, this.#value, caseSensitive))
    }

    /**
     * Reverse the string.
     *
     * @return { Stringable }
     */
    reverse (): Stringable {
        return new Stringable(Str.reverse(this.#value))
    }

    /**
     * Substitute placeholders { key } using object with dot notation.
     * 
     * @param data 
     * @param def 
     * @returns 
     */
    substitute (data: Record<string, unknown> = {}, def?: string): Stringable {
        return new Stringable(Str.substitute(this.#value, data, def))
    }

    /**
     * Repeat the string.
     *
     * @param { number } times
     *
     * @return { Stringable }
     */
    repeat (times: number): Stringable {
        return new Stringable(Str.repeat(this.#value, times))
    }

    /**
     * Replace the given value in the given string.
     *
     * @param { string | string[] } search
     * @param { string } replace
     * @param { boolean } caseSensitive
     *
     * @return { Stringable }
     */
    replace (search: string | string[], replace: string, caseSensitive: boolean = true): Stringable {
        return new Stringable(Str.replace(search, replace, this.#value, caseSensitive))
    }

    /**
     * Replace a given value in the string sequentially with an array.
     *
     * @param { string } search
     * @param { string[] } replace
     *
     * @return { Stringable }
     */
    replaceArray (search: string, replace: string[]): Stringable {
        return new Stringable(Str.replaceArray(search, replace, this.#value))
    }

    /**
     * Replace the first occurrence of a given value in the string.
     *
     * @param { string } search
     * @param { string } replace
     *
     * @return { Stringable }
     */
    replaceFirst (search: string, replace: string): Stringable {
        return new Stringable(Str.replaceFirst(search, replace, this.#value))
    }

    /**
     * Replace the first occurrence of the given value if it appears at the start of the string.
     *
     * @param { string } search
     * @param { string } replace
     *
     * @return { Stringable }
     */
    replaceStart (search: string, replace: string): Stringable {
        return new Stringable(Str.replaceStart(search, replace, this.#value))
    }

    /**
     * Replace the last occurrence of a given value in the string.
     *
     * @param { string } search
     * @param { string } replace
     *
     * @return { Stringable }
     */
    replaceLast (search: string, replace: string): Stringable {
        return new Stringable(Str.replaceLast(search, replace, this.#value))
    }

    /**
     * Replace the last occurrence of a given value if it appears at the end of the string.
     *
     * @param { string } search
     * @param { string } replace
     *
     * @return { Stringable }
     */
    replaceEnd (search: string, replace: string): Stringable {
        return new Stringable(Str.replaceEnd(search, replace, this.#value))
    }

    /**
     * Replace the patterns matching the given regular expression.
     *
     * @param { string } pattern
     * @param { string | function } replace
     *
     * @return { Stringable }
     */
    replaceMatches (pattern: string, replace: string | Function): Stringable {
        const body: string = RegExpString.make(/^\/(.*)\/\w*$/, pattern)
        const flags: string = RegExpString.make(/^\/.*\/(\w*)$/, pattern)
        const expression: RegExp = new RegExp(body, flags + (flags.indexOf('g') !== -1 ? '' : 'g'))

        if (replace instanceof Function) {
            this.#value.replace(expression, (matched: string): string => matched)
        }

        return new Stringable(this.#value.replace(expression, (replace as string)))
    }

    /**
     * Remove all "extra" blank space from the given string.
     *
     * @return { Stringable }
     */
    squish (): Stringable {
        return new Stringable(Str.squish(this.#value))
    }

    /**
     * Begin a string with a single instance of a given value.
     *
     * @param { string } prefix
     *
     * @return { Stringable }
     */
    start (prefix: string): Stringable {
        return new Stringable(Str.start(this.#value, prefix))
    }

    /**
     * Convert the given string to upper-case.
     *
     * @return { Stringable }
     */
    upper (): Stringable {
        return new Stringable(Str.upper(this.#value))
    }

    /**
     * Convert the given string to title case.
     *
     * @return { Stringable }
     */
    title (): Stringable {
        return new Stringable(Str.title(this.#value))
    }

    /**
     * Convert the given string to title case for each word.
     *
     * @return { Stringable }
     */
    headline (): Stringable {
        return new Stringable(Str.headline(this.#value))
    }

    /**
     * Convert the given string to APA-style title case.
     *
     * @see https://apastyle.apa.org/style-grammar-guidelines/capitalization/title-case
     *
     * @return { Stringable }
     */
    apa (): Stringable {
        return new Stringable(Str.apa(this.#value))
    }

    /**
     * Get the singular form of an English word.
     *
     * @return { Stringable }
     */
    singular (): Stringable {
        return new Stringable(Str.singular(this.#value))
    }

    /**
     * Generate a URL friendly "slug" from a given string.
     *
     * @param { string } separator
     * @param { object } dictionary
     *
     * @return { Stringable }
     */
    slug (separator: string = '-', dictionary: { [key: string]: string } = { '@': 'at' }): Stringable {
        return new Stringable(Str.slug(this.#value, separator, dictionary))
    }

    /**
     * Convert a string to snake case.
     *
     * @param { string } delimiter
     *
     * @return { Stringable }
     */
    snake (delimiter: string = '_'): Stringable {
        return new Stringable(Str.snake(this.#value, delimiter))
    }

    /**
     * Determine if a given string starts with a given substring.
     *
     * @param { string | string[] } needles
     *
     * @return { boolean }
     */
    startsWith (needles: string | string[]): boolean {
        return Str.startsWith(this.#value, needles)
    }

    /**
     * Determine if a given string doesn't start with a given substring.
     *
     * @param { string | string[] } needles
     *
     * @return { boolean }
     */
    doesntStartWith (needles: string | string[]): boolean {
        return Str.doesntStartWith(this.#value, needles)
    }

    /**
     * Convert a value to studly caps case.
     *
     * @return { Stringable }
     */
    studly (): Stringable {
        return new Stringable(Str.studly(this.#value))
    }

    /**
     * Convert a value to Pascal case.
     *
     * @return { Stringable }
     */
    pascal (): Stringable {
        return new Stringable(Str.pascal(this.#value))
    }

    /**
     * Returns the portion of the string specified by the start and length parameters.
     *
     * @param { number } start
     * @param { number | null } length
     *
     * @return { Stringable }
     */
    substr (start: number, length: number | null = null): Stringable {
        return new Stringable(Str.substr(this.#value, start, length))
    }

    /**
     * Returns the number of substring occurrences.
     *
     * @param { string } needle
     * @param { number } offset
     * @param { number | null } length
     *
     * @return { number }
     */
    substrCount (needle: string, offset: number = 0, length: number | null = null): number {
        return Str.substrCount(this.#value, needle, offset, length)
    }

    /**
     * Replace text within a portion of a string.
     *
     * @param { string } replace
     * @param { number } offset
     * @param { number | null } length
     *
     * @return { Stringable }
     */
    substrReplace (replace: string, offset: number = 0, length: number | null = null): Stringable {
        return new Stringable(Str.substrReplace(this.#value, replace, offset, length))
    }

    /**
     * Swap multiple keywords in a string with other keywords.
     *
     * @param { Record<string, string> } map
     *
     * @return { Stringable }
     */
    swap (map: Record<string, string>): Stringable {
        return new Stringable(Str.swap(map, this.#value))
    }

    /**
     * Take the first or last {limit} characters.
     *
     * @param { number } limit
     *
     * @return { Stringable }
     */
    take (limit: number): Stringable {
        if (limit < 0) {
            return this.substr(limit)
        }

        return this.substr(0, limit)
    }

    /**
     * Call the given Closure with this instance then return the instance.
     *
     * @param { ((instance: this) => any) } callback
     *
     * @return { Stringable }
     */
    tap (callback: ((instance: this) => any)): this {
        callback(this)

        return this
    }

    /**
     * Trim the string of the given characters.
     *
     * @param { string | null } characters
     *
     * @return { Stringable }
     */
    trim (characters: string | null = null): Stringable {
        return new Stringable(Str.trim(this.#value, characters))
    }

    /**
     * Left trim the string of the given characters.
     *
     * @param { string | string[]|null } characters
     *
     * @return { Stringable }
     */
    ltrim (characters: string | null = null): Stringable {
        return new Stringable(Str.ltrim(this.#value, characters))
    }

    /**
     * Right trim the string of the given characters.
     *
     * @param { string | string[]|null } characters
     *
     * @return { Stringable }
     */
    rtrim (characters: string | null = null): Stringable {
        return new Stringable(Str.rtrim(this.#value, characters))
    }

    /**
     * Make a string's first character lowercase.
     *
     * @return { Stringable }
     */
    lcfirst (): Stringable {
        return new Stringable(Str.lcfirst(this.#value))
    }

    /**
     * Make a string's first character uppercase.
     *
     * @return { Stringable }
     */
    ucfirst (): Stringable {
        return new Stringable(Str.ucfirst(this.#value))
    }

    /**
     * Split a string by uppercase characters.
     *
     * @return { string[] }
     */
    ucsplit (): string[] {
        return Str.ucsplit(this.#value)
    }

    /**
     * Apply the callback if the given "value" is (or resolves to) truthy.
     *
     * @param { Value<this> } value
     * @param { Callback<this> } callback
     * @param { Fallback<this> } fallback
     *
     * @return { Stringable }
     */
    when (value: Value<this>, callback: Callback<this>, fallback: Fallback<this> = null): this {
        value = value instanceof Function ? value(this) : value

        if (value) {
            return callback(this, value) ?? this
        } else if (fallback) {
            return fallback(this, value) ?? this
        }

        return this
    }

    /**
     * Apply the callback if the given "value" is (or resolves to) falsy.
     *
     * @param { Value<this> } value
     * @param { Callback<this> } callback
     * @param { Fallback<this> } fallback
     *
     * @return { this }
     */
    unless (value: Value<this>, callback: Callback<this>, fallback: Fallback<this> = null): this {
        value = value instanceof Function ? value(this) : value

        if (!value) {
            return callback(this, value) ?? this
        } else if (fallback) {
            return fallback(this, value) ?? this
        }

        return this
    }

    /**
     * Validate an IP address
     * 
     * @param host 
     * @param type 
     * @returns 
     */
    public validateIp (type: 'ipv4' | 'ipv6' = 'ipv4') {
        return Str.validateIp(this.#value, type)
    }

    /**
     * Execute the given callback if the string contains a given substring.
     *
     * @param { string | string[] } needles
     * @param { Callback<this> } callback
     * @param { Fallback<this> } fallback
     *
     * @return { this }
     */
    whenContains (needles: string | string[], callback: Callback<this>, fallback: Fallback<this> = null): this {
        return this.when(this.contains(needles), callback, fallback)
    }

    /**
     * Execute the given callback if the string contains all array values.
     *
     * @param { string[] } needles
     * @param { Callback<this> } callback
     * @param { Fallback<this> } fallback
     *
     * @return { this }
     */
    whenContainsAll (needles: string[], callback: Callback<this>, fallback: Fallback<this> = null): this {
        return this.when(this.containsAll(needles), callback, fallback)
    }

    /**
     * Execute the given callback if the string is empty.
     *
     * @param { Callback<this> } callback
     * @param { Fallback<this> } fallback
     *
     * @return { this }
     */
    whenEmpty (callback: Callback<this>, fallback: Fallback<this> = null): this {
        return this.when(this.isEmpty(), callback, fallback)
    }

    /**
     * Execute the given callback if the string is not empty.
     *
     * @param { Callback<this> } callback
     * @param { Fallback<this> } fallback
     *
     * @return { this }
     */
    whenNotEmpty (callback: Callback<this>, fallback: Fallback<this> = null): this {
        return this.when(this.isNotEmpty(), callback, fallback)
    }

    /**
     * Execute the given callback if the string ends with a given substring.
     *
     * @param { string | string[] } needles
     * @param { Callback<this> } callback
     * @param { Fallback<this> } fallback
     *
     * @return { this }
     */
    whenEndsWith (needles: string | string[], callback: Callback<this>, fallback: Fallback<this> = null): this {
        return this.when(this.endsWith(needles), callback, fallback)
    }

    /**
     * Execute the given callback if the string doesn't end with a given substring.
     *
     * @param { string | string[] } needles
     * @param { Callback<this> } callback
     * @param { Fallback<this> } fallback
     *
     * @return { this }
     */
    whenDoesntEndWith (needles: string | string[], callback: Callback<this>, fallback: Fallback<this> = null): this {
        return this.when(this.doesntEndWith(needles), callback, fallback)
    }

    /**
     * Execute the given callback if the string is an exact match with the given value.
     *
     * @param { string } value
     * @param { Callback<this> } callback
     * @param { Fallback<this> } fallback
     *
     * @return { this }
     */
    whenExactly (value: string, callback: Callback<this>, fallback: Fallback<this> = null): this {
        return this.when(this.exactly(value), callback, fallback)
    }

    /**
     * Execute the given callback if the string is not an exact match with the given value.
     *
     * @param { string } value
     * @param { Callback<this> } callback
     * @param { Fallback<this> } fallback
     *
     * @return { this }
     */
    whenNotExactly (value: string, callback: Callback<this>, fallback: Fallback<this> = null): this {
        return this.when(!this.exactly(value), callback, fallback)
    }

    /**
     * Execute the given callback if the string matches a given pattern.
     *
     * @param { string | string[] } pattern
     * @param { Callback<this> } callback
     * @param { Fallback<this> } fallback
     *
     * @return { this }
     */
    whenIs (pattern: string | string[], callback: Callback<this>, fallback: Fallback<this> = null): this {
        return this.when(this.is(pattern), callback, fallback)
    }

    /**
     * Execute the given callback if the string is 7-bit ASCII.
     *
     * @param { Callback<this> } callback
     * @param { Fallback<this> } fallback
     *
     * @return { this }
     */
    whenIsAscii (callback: Callback<this>, fallback: Fallback<this> = null): this {
        return this.when(this.isAscii(), callback, fallback)
    }

    /**
     * Execute the given callback if the string is a valid UUID.
     *
     * @param { Callback<this> } callback
     * @param { Fallback<this> } fallback
     *
     * @return { this }
     */
    whenIsUuid (callback: Callback<this>, fallback: Fallback<this> = null): this {
        return this.when(this.isUuid(), callback, fallback)
    }

    /**
     * Execute the given callback if the string is a valid ULID.
     *
     * @param { Callback<this> } callback
     * @param { Fallback<this> } fallback
     *
     * @return { this }
     */
    whenIsUlid (callback: Callback<this>, fallback: Fallback<this> = null): this {
        return this.when(this.isUlid(), callback, fallback)
    }

    /**
     * Execute the given callback if the string starts with a given substring.
     *
     * @param { string | string[] } needles
     * @param { Callback<this> } callback
     * @param { Fallback<this> } fallback
     *
     * @return { this }
     */
    whenStartsWith (needles: string | string[], callback: Callback<this>, fallback: Fallback<this> = null): this {
        return this.when(this.startsWith(needles), callback, fallback)
    }

    /**
     * Execute the given callback if the string doesn't start with a given substring.
     *
     * @param { string | string[] } needles
     * @param { Callback<this> } callback
     * @param { Fallback<this> } fallback
     *
     * @return { this }
     */
    whenDoesntStartWith (needles: string | string[], callback: Callback<this>, fallback: Fallback<this> = null): this {
        return this.when(this.doesntStartWith(needles), callback, fallback)
    }

    /**
     * Execute the given callback if the string matches the given pattern.
     *
     * @param { string } pattern
     * @param { Callback<this> } callback
     * @param { Fallback<this> } fallback
     *
     * @return { this }
     */
    whenTest (pattern: string, callback: Callback<this>, fallback: Fallback<this> = null): this {
        return this.when(this.test(pattern), callback, fallback)
    }

    /**
     * Limit the number of words in a string.
     *
     * @param { number } words
     * @param { string } end
     *
     * @return { Stringable }
     */
    words (words: number = 100, end: string = '...'): Stringable {
        return new Stringable(Str.words(this.#value, words, end))
    }

    /**
     * Get the number of words a string contains.
     *
     * @return { number }
     */
    wordCount (): number {
        return Str.wordCount(this.#value)
    }

    /**
     * Wrap a string to a given number of characters.
     *
     * @param { number } characters
     * @param { string } breakStr
     * @param { boolean } cutLongWords
     *
     * @returns { this }
     */
    wordWrap (characters: number = 75, breakStr: string = '\n', cutLongWords: boolean = false): Stringable {
        return new Stringable(Str.wordWrap(this.#value, characters, breakStr, cutLongWords))
    }

    /**
     * Wrap the string with the given strings.
     *
     * @param { string } before
     * @param { string | null } after
     *
     * @return { Stringable }
     */
    wrap (before: string, after: string | null = null): Stringable {
        return new Stringable(Str.wrap(this.#value, before, after))
    }

    /**
     * Unwrap the string with the given strings.
     *
     * @param { string } before
     * @param { string | null } after
     *
     * @return { Stringable }
     */
    unwrap (before: string, after: string | null = null): Stringable {
        return new Stringable(Str.unwrap(this.#value, before, after))
    }

    /**
     * Convert the string into a `HtmlString` instance.
     *
     * @return { HtmlStringType }
     */
    toHtmlString (): HtmlStringType {
        return new HtmlString(this.#value).toHtml()
    }

    /**
     * Convert the string to Base64 encoding.
     *
     * @return { Stringable }
     */
    toBase64 (): Stringable {
        return new Stringable(Str.toBase64(this.#value))
    }

    /**
     * Decode the Base64 encoded string.
     *
     * @return { Stringable }
     */
    fromBase64 (): Stringable {
        return new Stringable(Str.fromBase64(this.#value))
    }

    /**
     * Checks if a string is numeric
     * 
     * @return { boolean }
     */
    isNumber (): boolean {
        return Str.isNumber(this.#value)
    }

    /**
     * Checks if a string is an integer
     * 
     * @return { boolean }
     */
    isInteger (): boolean {
        return Str.isInteger(this.#value)
    }

    /**
     * ROT-N cipher.
     * 
     * @param n 
     * @returns 
     */
    rot (n: number = 13): Stringable {
        return new Stringable(Str.rot(this.#value, n))
    }

    /**
     * Replace trailing punctuation with new format.
     * 
     * @param newFormat 
     * @returns 
     */
    replacePunctuation (newFormat: string): Stringable {
        return new Stringable(Str.replacePunctuation(this.#value, newFormat))
    }

    /**
     * Array/object driven text replacement.
     * 
     * @param replacements 
     * @returns 
     */
    translate (replacements: Record<string, string> | Array<[string, string]>): Stringable {
        return new Stringable(Str.translate(this.#value, replacements))
    }

    /**
     * Strip slashes recursively.
     * 
     * @returns 
     */
    ss (): Stringable {
        return new Stringable(Str.ss(this.#value))
    }

    /**
     * First and last N lines.
     * 
     * @param amount 
     * @returns 
     */
    firstLines (amount: number = 1): Stringable {
        return new Stringable(Str.firstLines(this.#value, amount))
    }

    /**
     * Last and first N lines.
     * 
     * @param amount 
     * @returns 
     */
    lastLines (amount: number = 1): Stringable {
        return new Stringable(Str.lastLines(this.#value, amount))
    }

    /**
     * Dump the string.
     *
     * @return { void }
     */
    dump (): void {
        console.log(this.#value)
    }

    /**
     * Dump the string and end the script.
     *
     * @return { never }
     */
    dd (): never {
        this.dump()

        throw new Error('dd()')
    }

    /**
     * Get the underlying string value.
     *
     * @return { string }
     */
    value (): string {
        return this.toString()
    }

    /**
     * Get the raw string value.
     *
     * @return { string }
     */
    toString (): string {
        return this.#value
    }

    /**
     * Get the underlying string value as an integer.
     *
     * @param { number } base
     *
     * @return { number }
     */
    toInteger (base: number = 10): number {
        const value: number = parseInt(this.#value, base)

        return isNaN(value) || !isFinite(value) ? 0 : value
    }

    /**
     * Get the underlying string value as a float.
     *
     * @return { number }
     */
    toFloat (): number {
        return !isNaN(parseFloat(this.#value)) ? parseFloat(this.#value) : 0
    }

    /**
     * Get the underlying string value as a boolean.
     *
     * Returns true when value is "1", "true", "on", and "yes". Otherwise, returns false.
     *
     * @return { boolean }
     */
    toBoolean (): boolean {
        switch (this.#value) {
            case '1':
            case 'true':
            case 'on':
            case 'yes':
                return true
            default:
                return false
        }
    }

    /**
     * Get the underlying string value as a formatted Date string.
     *
     * @param { string | null } format
     * @param { string | null } tz
     */
    toDate (format: string | null = null, tz: string | null = null): string {
        if (new Date(this.#value).toString() === 'Invalid Date') {
            return 'Invalid Date'
        }

        if (format === null) {
            return new Date(this.#value).toLocaleDateString('en-us', {
                year: 'numeric',
                month: 'numeric',
                day: 'numeric',
                hour: 'numeric',
                minute: 'numeric',
                second: 'numeric',
                hour12: false,
                timeZone: tz ?? undefined,
            })
        }

        let date: string = ''

        const now: Date = new Date(new Date(this.#value).toLocaleString('en-US', {
            year: 'numeric',
            month: 'numeric',
            day: 'numeric',
            hour: 'numeric',
            minute: 'numeric',
            second: 'numeric',
            fractionalSecondDigits: 3,
            hour12: false,
            timeZone: tz ?? undefined,
        }))

        const month: number = now.getMonth()
        const dayOfTheWeek: number = now.getDay()
        const dayOfTheMonth: number = now.getDate()
        const year: number = now.getFullYear()
        const hours: number = now.getHours()
        const minutes: number = now.getMinutes()
        const seconds: number = now.getSeconds()
        const milliseconds: number = now.getMilliseconds()

        const elements: RegExpMatchArray | null = format.match(/\\?.|./g)

        for (const element of elements!) {
            switch (element) {
                // Day of the month, 2 digits with leading zeros (e.g., 01 to 31)
                case 'd':
                    date += Str.padLeft(dayOfTheMonth.toString(), 2, '0')

                    break

                // A textual representation of a day, three letters (e.g., Mon through Sun)
                case 'D':
                    date += now.toLocaleString('en-US', { weekday: 'short' })

                    break

                // Day of the month without leading zeros (e.g., 1 to 31)
                case 'j':
                    date += dayOfTheMonth

                    break

                // A full textual representation of the day of the week (e.g., Sunday through Saturday)
                case 'l':
                    date += now.toLocaleString('en-US', { weekday: 'long' })

                    break

                // ISO 8601 numeric representation of the day of the week (e.g., 1 (for Monday) through 7 (for Sunday))
                case 'N':
                    date += dayOfTheWeek !== 0 ? dayOfTheWeek : 0

                    break

                // English ordinal suffix for the day of the month, 2 characters (e.g., st, nd, rd or th)
                case 'S': {
                    const suffix: { [key: number]: string } = {
                        1: 'st',
                        2: 'nd',
                        3: 'rd',
                        21: 'st',
                        22: 'nd',
                        23: 'rd',
                        31: 'st'
                    }
                    date += suffix[dayOfTheMonth] ?? 'th'

                    break
                }
                // Numeric representation of the day of the week (e.g., 0 (for Sunday) through 6 (for Saturday))
                case 'w':
                    date += dayOfTheWeek

                    break

                // Numeric representation of the day of the week (e.g., The day of the year (starting from 0))
                case 'z': {
                    const start: Date = new Date(year, 0, 0)
                    const diff: number = ((now as unknown as number) - (start as unknown as number)) + ((start.getTimezoneOffset() - now.getTimezoneOffset()) * 60 * 1000)
                    const day: number = 86400000
                    const currentDay: number = Math.floor(diff / day)

                    date += currentDay

                    break
                }
                // ISO 8601 week number of year, weeks starting on Monday (e.g., 42 (the 42nd week in the year))
                case 'W': {
                    const parsedDate: Date = new Date(Date.UTC(year, month, dayOfTheMonth))
                    const weekDay: number = parsedDate.getUTCDay() || 7

                    parsedDate.setUTCDate(parsedDate.getUTCDate() + 4 - weekDay)

                    const yearStart: Date = new Date(Date.UTC(parsedDate.getUTCFullYear(), 0, 1))
                    const weekNumber: number = Math.ceil(((((parsedDate as unknown as number) - (yearStart as unknown as number)) / 86400000) + 1) / 7)

                    date += Str.padLeft((weekNumber.toString()), 2, '0')

                    break
                }
                // A full textual representation of a month, such as January or March (e.g., January through December)
                case 'F':
                    date += now.toLocaleString('en-US', { month: 'long' })

                    break

                // Numeric representation of a month, with leading zeros (e.g., 01 through 12)
                case 'm': {
                    const currentMonth: number = month + 1

                    date += Str.padLeft(currentMonth.toString(), 2, '0')

                    break
                }
                // A short textual representation of a month, three letters (e.g., Jan through Dec)
                case 'M':
                    date += now.toLocaleString('en-US', { month: 'short' })

                    break

                // Numeric representation of a month, without leading zeros (e.g., 1 through 12)
                case 'n':
                    date += month + 1

                    break

                // Number of days in the given month (e.g., 28 through 31)
                case 't':
                    date += new Date(year, month + 1, 0).getDate()

                    break

                // Whether it's a leap year (e.g., 1 if it is a leap year, 0 otherwise)
                case 'L':
                    date += new Date(year, 1, 29).getMonth() === 1 ? '1' : '0'

                    break

                // ISO 8601 week-numbering year. This has the same value as Y,
                // except that if the ISO week number (W) belongs to the previous or next year,
                // that year is used instead. (e.g., 1999 or 2003)
                case 'o':
                    date += now.toISOString().substring(0, 4)

                    break

                // An expanded full numeric representation of a year, at least 4 digits, with - for years BCE, and + for years CE. (e.g., -0055, +0787, +1999, +10191)
                case 'X':
                    date += year < 0 ? '-' + year : '+' + year

                    break

                // An expanded full numeric representation if required,
                // or a standard full numeral representation if possible (like Y).
                // At least four digits. Years BCE are prefixed with a -.
                // Years beyond (and including) 10000 are prefixed by a +. (e.g., -0055, 0787, 1999, +10191)
                case 'x':
                    date += year < 10000 ? year : '-' + year

                    break

                // A full numeric representation of a year, at least 4 digits, with - for years BCE. (e.g., -0055, 0787, 1999, 2003, 10191)
                case 'Y':
                    date += year

                    break

                // A two-digit representation of a year (e.g., 99 or 03)
                case 'y':
                    date += year.toString().substring(2)

                    break

                // Lowercase Ante meridiem and Post meridiem (e.g., am or pm)
                case 'a':
                    date += hours < 12 ? 'am' : 'pm'

                    break

                // Uppercase Ante meridiem and Post meridiem (e.g., AM or PM)
                case 'A':
                    date += hours < 12 ? 'AM' : 'PM'

                    break

                // Swatch Internet time (e.g., 000 through 999)
                case 'B': {
                    const hours: number = now.getUTCHours()
                    const minutes: number = now.getUTCMinutes()
                    const seconds: number = now.getUTCSeconds()

                    date += Math.floor((((hours + 1) % 24) + minutes / 60 + seconds / 3600) * 1000 / 24)

                    break
                }
                // 12-hour format of an hour without leading zeros (e.g., 1 through 12)
                case 'g':
                    date += hours > 12 ? hours - 12 : hours

                    break

                // 24-hour format of an hour without leading zeros (e.g., 0 through 23)
                case 'G':
                    date += hours

                    break

                // 12-hour format of an hour with leading zeros (e.g., 01 through 12)
                case 'h':
                    date += Str.padLeft((hours > 12 ? hours - 12 : hours).toString(), 2, '0')

                    break

                // 24-hour format of an hour with leading zeros (e.g., 00 through 23)
                case 'H':
                    date += Str.padLeft(hours.toString(), 2, '0')

                    break

                // Minutes with leading zeros (e.g., 00 to 59)
                case 'i':
                    date += Str.padLeft(minutes.toString(), 2, '0')

                    break

                // Seconds with leading zeros (e.g., 00 to 59)
                case 's':
                    date += Str.padLeft(seconds.toString(), 2, '0')

                    break

                // Microseconds. (e.g., 654321)
                case 'u':
                    throw new Error('Microseconds are not supported.')

                // Milliseconds. (e.g., 654)
                case 'v': {
                    date += Str.padLeft(milliseconds.toString(), 3, '0')

                    break
                }

                // Timezone identifier (e.g., UTC, GMT, Atlantic/Azores)
                case 'e': {
                    date += Intl.DateTimeFormat('en-us', { timeZone: tz ?? undefined }).resolvedOptions().timeZone

                    break
                }

                // Whether the date is in daylight saving time (e.g., 1 if Daylight Saving Time, 0 otherwise)
                case 'I': {
                    const january: number = new Date(year, 0, 1).getTimezoneOffset()
                    const july: number = new Date(year, 6, 1).getTimezoneOffset()

                    date += Math.max(january, july) !== now.getTimezoneOffset() ? '1' : '0'

                    break
                }
                // Difference to Greenwich time (GMT) without colon between hours and minutes (e.g., +0200)
                case 'O': {
                    const timeZoneData: string = now.toLocaleDateString('en-us', {
                        timeZoneName: 'longOffset',
                        timeZone: tz ?? undefined,
                    })
                        .split(', ')
                        .pop()!
                        .trim()

                    date += timeZoneData.length !== 3 ? timeZoneData.substring(3).replace(':', '') : '+0000'

                    break
                }

                // Difference to Greenwich time (GMT) with colon between hours and minutes (e.g., +02:00)
                case 'P': {
                    const timeZoneData: string = now.toLocaleDateString('en-us', {
                        timeZoneName: 'longOffset',
                        timeZone: tz ?? undefined,
                    })
                        .split(', ')
                        .pop()!
                        .trim()

                    date += timeZoneData.length !== 3 ? timeZoneData.substring(3) : '+00:00'

                    break
                }

                // The same as P, but returns Z instead of +00:00 (e.g., +02:00)
                case 'p': {
                    const timeZoneData: string = now.toLocaleDateString('en-us', {
                        timeZoneName: 'longOffset',
                        timeZone: tz ?? undefined,
                    })
                        .split(', ')
                        .pop()!
                        .trim()

                    date += timeZoneData === 'GMT' ? 'Z' : timeZoneData.substring(3)

                    break
                }

                // Timezone abbreviation, if known; otherwise the GMT offset (e.g., EST, MDT, +05)
                case 'T': {
                    const timeZoneData: string = now.toLocaleDateString('en-us', {
                        timeZoneName: 'short',
                        timeZone: tz ?? undefined,
                    })
                        .split(', ')
                        .pop()!
                        .trim()

                    date += tz ?? timeZoneData.replace('GMT', 'UTC').split(/[+-]/)[0]

                    break
                }

                // Timezone offset in seconds.
                // The offset for timezones west of UTC is always negative,
                // and for those east of UTC is always positive. (e.g., -43200 through 50400)
                case 'Z': {
                    const timezone: string = now.toLocaleDateString('en-us', {
                        timeZoneName: 'longOffset',
                        timeZone: tz ?? undefined
                    })
                    const symbol: RegExpMatchArray | null = timezone.match(/[+-]/)
                    const data: string[] = timezone.split(/[+-]/)

                    const sign: string = symbol ? symbol.pop()! : '+'
                    const offset: string = data.length === 2 ? (data[1] as string) : '0:00'

                    const hours: number = parseInt(offset.split(':')[0] as string)
                    const minutes: number = parseInt(offset.split(':')[1] as string)

                    const offsetInSeconds: number = hours * 3600 + minutes * 60

                    date += `${sign}${offsetInSeconds}`

                    break
                }

                // ISO 8601 date (e.g., 2004-02-12T15:19:21+00:00)
                case 'c': {
                    date += `${this.toDate('Y-m-d\\TH:i:sP')}`

                    break
                }
                // RFC 2822/RFC 5322 formatted date (e.g., Thu, 21 Dec 2000 16:01:07 +0200)
                case 'r': {
                    date += new Stringable(this.#value).toDate('D, d M Y H:i:s O', tz)

                    break
                }

                // Seconds since the Unix Epoch (e.g., January 1, 1970 00:00:00 GMT)
                case 'U': {
                    date += Math.floor(now.getTime() / 1000)

                    break
                }

                default:
                    date += element.length >= 2 && element.indexOf('\\') > -1 ? element.replace('\\', '') : element
            }
        }

        return date
    }
}

export class HtmlString {
    /**
     * The HTML string.
     *
     * @type { string }
     */
    private readonly html: string

    /**
     * Create a new HTML string instance.
     *
     * @param { string } html
     *
     * @return void
     */
    constructor(html: string = '') {
        this.html = html
    }

    /**
     * Get the HTML string.
     *
     * @return { HtmlStringType }
     */
    toHtml (): HtmlStringType {
        const pattern: RegExp = /(?!<!DOCTYPE)<([^\s>]+)(\s|>)+/
        const tag: RegExpExecArray | null = RegExp(pattern).exec(this.html)

        if (tag === null) {
            return this.html
        }

        const DOM: HTMLElement = document.createElement(tag[1] as string)

        DOM.innerHTML = this.html

        return tag[1] === 'html' ? DOM : DOM.firstChild as HtmlStringType
    }

    /**
     * Determine if the given HTML string is empty.
     *
     * @return { boolean }
     */
    isEmpty (): boolean {
        return this.html === ''
    }

    /**
     * Determine if the given HTML string is not empty.
     *
     * @return { boolean }
     */
    isNotEmpty (): boolean {
        return !this.isEmpty()
    }

    /**
     * Get the HTML string.
     *
     * @return { string }
     */
    toString (): string {
        const html: HtmlStringType = this.toHtml()

        if (html instanceof HTMLElement) {
            return html.outerHTML
        }

        if (html instanceof Node) {
            return html.textContent as string
        }

        return html
    }
}

class RegExpString {
    /**
     * Build the Regular Expression string from the given parameter.
     *
     * @param { RegExp } pattern
     * @param { string } string
     *
     * @return { string }
     */
    static make (pattern: RegExp, string: string): string {
        if (string === '') {
            throw new Error('Empty regular expression.')
        }

        if (!string.startsWith('/')) {
            throw new Error('Delimiter must not be alphanumeric, backslash, or NUL.')
        }

        if (string.startsWith('/') && string.length === 1 || !string.endsWith('/')) {
            throw new Error('No ending delimiter \'/\'.')
        }

        const expression: RegExpExecArray | null = new RegExp(pattern).exec(string)

        return expression ? expression[1]! : ''
    }
}

/**
 * Get a new Stringable object from the given string.
 *
 * @param { string } string
 *
 * @return Stringable
 */
export function str (string: string = ''): Stringable {
    return Str.of(string)
}

/**
 * Quote regular expression characters.
 *
 * @param { string } string The input string.
 * @param { string | null } delimiter If the optional delimiter is specified, it will also be escaped.
 * This is useful for escaping the delimiter that is required by the PCRE functions.
 * The / is the most commonly used delimiter.
 *
 * @return { string } The quoted (escaped) string.
 */
function preg_quote (string: string, delimiter: string | null = null): string {
    const characters: (string | null)[] = [
        '-', '.', '\\', '+', '*', '?', '[', '^', ']',
        '$', '(', ')', '{', '}', '=', '!', '<', '>',
        '|', ':', delimiter
    ]

    const escaped: string = characters.filter(Boolean).map((character: string | null): string => `\\${character}`).join('')

    return string.replace(new RegExp(`[${escaped}]`, 'g'), '\\$&')
}

/**
 * Uppercase the first character of each word in a string
 *
 * @param { string } string The input string.
 * @param { string } separators The optional separators contains the word separator characters.

 * @return { string } String the modified string.
 */
function ucwords (string: string, separators: string = ' \t\r\n\f\v'): string {
    return string.split(separators).map((word: string): string => word[0]?.toUpperCase() + word.substring(1)).join(' ')
}

/**
 * Attempt to match the case on two strings.
 *
 * @param { string} value
 * @param { string } comparison
 *
 * @return { string }
 */
function matchCase (value: string, comparison: string): string {
    const cases: ((value: string) => string)[] = [
        (value: string): string => value.toLowerCase(),
        (value: string): string => value.toUpperCase(),
        (value: string): string => value.charAt(0).toUpperCase() + value.slice(1),
        (value: string): string => value.replace(/\b\w/g, (char: string): string => char.toUpperCase())
    ]

    for (const matcher of cases) {
        if (matcher(comparison) === comparison) {
            return matcher(value)
        }
    }

    return value
}

