/**
 * Abbreviates large numbers using SI symbols (K, M, B...) 
 * and formats the output according to the given locale.
 *
 * @param value - The number to abbreviate
 * @param locale - Optional locale string (default: "en-US")
 * @returns A localized, abbreviated number string
 */
export const abbreviate = (value?: number, locale: string = 'en-US'): string => {
    if (!value) return '0'

    // Numbers less than 1000 don't need abbreviation
    if (value < 1000) {
        return new Intl.NumberFormat(locale).format(value)
    }

    const si = [
        { v: 1e18, s: 'E' },
        { v: 1e15, s: 'P' },
        { v: 1e12, s: 'T' },
        { v: 1e9, s: 'B' },
        { v: 1e6, s: 'M' },
        { v: 1e3, s: 'K' },
    ]

    const match = si.find(scale => value >= scale.v)
    if (!match) return new Intl.NumberFormat(locale).format(value)

    const formatted = value / match.v

    return (
        new Intl.NumberFormat(locale, {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2,
        }).format(formatted) + match.s
    )
}

/**
 * Concverts a number into human readable string
 *
 * @param num The number to convert
 * @param slugify convert the ouput into a slug using this as a separator
 * @returns
 */
export const humanize = (num: number, slugify?: '-' | '_'): string => {
    if (!num) {
        return ''
    }

    if (slugify === '-' || slugify === '_') {
        const h = humanize(num)
        return typeof h === 'string' ? h.replace(' ', slugify).toLowerCase() : h
    }

    const ones = [
        '',
        'one',
        'two',
        'three',
        'four',
        'five',
        'six',
        'seven',
        'eight',
        'nine',
        'ten',
        'eleven',
        'twelve',
        'thirteen',
        'fourteen',
        'fifteen',
        'sixteen',
        'seventeen',
        'eighteen',
        'nineteen',
    ]
    const tens = [
        '',
        '',
        'twenty',
        'thirty',
        'forty',
        'fifty',
        'sixty',
        'seventy',
        'eighty',
        'ninety',
    ]

    const numString: string = num.toString()

    if (num < 0) throw new Error('Negative numbers are not supported.')

    if (num === 0) return 'zero'

    //the case of 1 - 20
    if (num < 20) {
        return ones[num] ?? ''
    }

    if (numString.length === 2) {
        return tens[numString[0] as unknown as number] + ' ' + ones[numString[1] as unknown as number]
    }

    //100 and more
    if (numString.length == 3) {
        if (numString[1] === '0' && numString[2] === '0')
            return ones[numString[0] as unknown as number] + ' hundred'
        else
            return (
                ones[numString[0] as unknown as number] +
                ' hundred and ' +
                humanize(+((numString[1] || '') + numString[2]), slugify)
            )
    }

    if (numString.length === 4) {
        const end = +((numString[1] || '') + numString[2] + numString[3])
        if (end === 0) return ones[numString[0] as unknown as number] + ' thousand'
        if (end < 100)
            return ones[numString[0] as unknown as number] + ' thousand and ' + humanize(end, slugify)
        return ones[numString[0] as unknown as number] + ' thousand ' + humanize(end, slugify)
    }

    return num as unknown as string
}

/**
 * Converts a number of bytes into a human-readable string.
 *
 * @param bytes - The size in bytes to convert
 * @param decimals - Number of decimal places to display (default: 2)
 * @param bits - If true, uses 1000-based (SI) units (B, KB, MB...); 
 *               otherwise uses 1024-based binary units (Bytes, KiB...)
 * @returns A formatted string with the appropriate unit
 */
export const toBytes = (
    bytes?: number,
    decimals: number = 2,
    bits: boolean = false
): string => {
    if (!bytes || isNaN(bytes)) {
        return bits ? '0 B' : '0 Bytes'
    }

    const base = bits ? 1000 : 1024
    const dm = decimals < 0 ? 0 : decimals
    const sizes = bits
        ? ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'] // SI units
        : ['Bytes', 'KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB'] // Binary units

    const index = Math.floor(Math.log(bytes) / Math.log(base))

    const value = parseFloat((bytes / Math.pow(base, index)).toFixed(dm))
    return `${value} ${sizes[index]}`
}

/**
 * Formats a duration (in seconds) into a human-readable string.
 *
 * @param seconds - Duration in seconds
 * @param worded - If true, outputs worded format (e.g., "1hr 2min 3sec"),
 *                 otherwise HH:MM:SS (e.g., "01:02:03")
 * @returns A formatted time string
 */
export const toHumanTime = (
    seconds: number = 0,
    worded: boolean = false
): string => {
    // Ensure seconds is a number and not negative
    if (isNaN(seconds) || seconds < 0) seconds = 0

    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = Math.floor(seconds % 60)

    // Worded format → "1hr 2min 3sec"
    if (worded) {
        const parts = []
        if (hours) parts.push(`${hours}hr`)
        if (minutes) parts.push(`${minutes}min`)
        if (secs || (!hours && !minutes)) parts.push(`${secs}sec`)
        return parts.join(' ')
    }

    // HH:MM:SS format → zero-padded
    const hh = hours > 0 ? `${hours}:` : ''
    const mm = (hours > 0 && minutes < 10 ? `0${minutes}` : minutes) + ':'
    const ss = secs < 10 ? `0${secs}` : secs

    return `${hh}${mm}${ss}`
}

