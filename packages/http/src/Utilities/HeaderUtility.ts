/**
 * HTTP header utility functions .
 */

import { InvalidArgumentException } from '@h3ravel/support'

export class HeaderUtility {
    static readonly DISPOSITION_ATTACHMENT = 'attachment'
    static readonly DISPOSITION_INLINE = 'inline'

    private constructor() { }

    /**
     * Splits an HTTP header by one or more separators.
     *
     * Example:
     * HeaderUtility.split('da, en-gb;q=0.8', ',;')
     * // returns [['da'], ['en-gb', 'q=0.8']]
     */
    static split (header: string, separators: string): string[][] {
        if (!separators) {
            throw new Error('At least one separator must be specified.')
        }

        const quotedSeparators = separators.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')

        // Flattened regex (no /x flag)
        const regex = new RegExp(
            `(?!\\s)(?:(?:"(?:[^"\\\\]|\\\\.)*(?:"|\\\\|$))|[^"${quotedSeparators}"]+)+(?<!\\s)|\\s*(?<separator>[${quotedSeparators}])\\s*`,
            'g'
        )

        const matches: { [key: string]: string }[] = []
        let match: RegExpExecArray | null
        while ((match = regex.exec(header.trim())) !== null) {
            matches.push(match.groups ? { separator: match.groups.separator ?? '', 0: match[0] } : { 0: match[0] })
        }

        return this.groupParts(matches, separators)
    }

    /**
     * Combines an array of arrays into one associative object.
     * [['foo', 'abc'], ['bar']] => { foo: 'abc', bar: true }
     */
    static combine (parts: (string | true)[][]): Record<string, string | boolean> {
        const assoc: Record<string, string | boolean> = {}

        for (const part of parts) {
            const name = String(part[0]).toLowerCase()
            const value = part[1] ?? true
            assoc[name] = value
        }

        return assoc
    }

    /**
     * Joins an associative object into a string for use in an HTTP header.
     * { foo: 'abc', bar: true, baz: 'a b c' } => 'foo=abc, bar, baz="a b c"'
     */
    static toString (assoc: Record<string, string | boolean>, separator: string): string {
        const parts = Object.entries(assoc).map(([name, value]) => {
            return value === true ? name : `${name}=${HeaderUtility.quote(value as string)}`
        })

        return parts.join(`${separator} `)
    }

    /**
     * Encodes a string as a quoted string, if necessary.
     */
    static quote (s: string): string {
        if (/^[a-z0-9!#$%&'*.^_`|~-]+$/i.test(s)) {
            return s
        }

        return `"${s.replace(/(["\\])/g, '\\$1')}"`
    }

    /**
     * Decodes a quoted string.
     */
    static unquote (s: string): string {
        return s.replace(/\\(.)|"/g, '$1')
    }

    /**
     * Generates an HTTP Content-Disposition field-value.
     *
     * @see RFC 6266
     */
    static makeDisposition (
        disposition: string,
        filename: string,
        filenameFallback: string = ''
    ): string {
        if (
            ![HeaderUtility.DISPOSITION_ATTACHMENT, HeaderUtility.DISPOSITION_INLINE].includes(disposition)
        ) {
            throw new Error(
                `The disposition must be either "${HeaderUtility.DISPOSITION_ATTACHMENT}" or "${HeaderUtility.DISPOSITION_INLINE}".`
            )
        }

        if (filenameFallback === '') {
            filenameFallback = filename
        }

        // Ensure fallback is ASCII
        if (!/^[\x20-\x7e]*$/.test(filenameFallback)) {
            throw new InvalidArgumentException('The filename fallback must only contain ASCII characters.')
        }

        if (filenameFallback.includes('%')) {
            throw new InvalidArgumentException('The filename fallback cannot contain the "%" character.')
        }

        if (
            [filename, filenameFallback].some((f) => f.includes('/') || f.includes('\\'))
        ) {
            throw new InvalidArgumentException(
                'The filename and the fallback cannot contain the "/" and "\\" characters.'
            )
        }

        const params: Record<string, string> = { filename: filenameFallback }

        if (filename !== filenameFallback) {
            params['filename*'] = `utf-8''${encodeURIComponent(filename)}`
        }

        return `${disposition}; ${HeaderUtility.toString(params, ';')}`
    }

    /**
     * Like parse_str(), but preserves dots in variable names.
     */
    static parseQuery (query: string, ignoreBrackets = false, separator = '&'): Record<string, any> {
        const q: Record<string, any> = {}
        const pairs = query.split(separator)

        for (let v of pairs) {
            const nullPos = v.indexOf('\0')
            if (nullPos !== -1) v = v.slice(0, nullPos)

            const eqPos = v.indexOf('=')
            let k: string
            let val: string

            if (eqPos === -1) {
                k = decodeURIComponent(v)
                val = ''
            } else {
                k = decodeURIComponent(v.slice(0, eqPos))
                val = v.slice(eqPos)
            }

            const nullKeyPos = k.indexOf('\0')
            if (nullKeyPos !== -1) k = k.slice(0, nullKeyPos)

            k = k.trimStart()

            if (ignoreBrackets) {
                q[k] = q[k] || []
                q[k].push(decodeURIComponent(val.slice(1)))
                continue
            }

            const bracketPos = k.indexOf('[')
            if (bracketPos === -1) {
                q[Buffer.from(k).toString('hex') + val] = val
            } else {
                const prefix = Buffer.from(k.slice(0, bracketPos)).toString('hex')
                q[prefix + encodeURIComponent(k.slice(bracketPos)) + val] = val
            }
        }

        // Build final parsed result
        if (ignoreBrackets) return q

        const parsed = new URLSearchParams(Object.keys(q).join('&'))
        const result: Record<string, any> = {}

        for (const [key, value] of parsed.entries()) {
            const underscorePos = key.indexOf('_')
            if (underscorePos !== -1) {
                const newKey =
                    key.slice(0, underscorePos) +
                    Buffer.from(key.slice(0, underscorePos), 'hex').toString('utf8') +
                    '[' +
                    key.slice(underscorePos + 1) +
                    ']'
                result[newKey] = value
            } else {
                result[Buffer.from(key, 'hex').toString('utf8')] = value
            }
        }

        return result
    }

    private static groupParts (matches: any[], separators: string, first = true): any[] {
        const separator = separators[0]
        const rest = separators.slice(1)
        let i = 0

        if (!rest && !first) {
            const parts = ['']
            for (const match of matches) {
                if (!i && match.separator) {
                    i = 1
                    parts[1] = ''
                } else {
                    parts[i] += this.unquote(match[0])
                }
            }
            return parts
        }

        const parts: any[] = []
        const grouped: Record<number, any[]> = {}
        for (const match of matches) {
            if (match.separator === separator) ++i
            else (grouped[i] ||= []).push(match)
        }

        for (const group of Object.values(grouped)) {
            if (!rest && this.unquote(group[0][0]) !== '') {
                parts.push(this.unquote(group[0][0]))
            } else {
                const sub = this.groupParts(group, rest, false)
                if (sub) parts.push(sub)
            }
        }

        return parts
    }
}
