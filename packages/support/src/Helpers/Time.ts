export type TimeFormat = 'Y-m-d' | 'Y-m-d H:i:s' | 'd-m-Y' | 'd/m/Y' | 'M j, Y' | 'F j, Y' | 'D j M' | 'timestamp' | 'unix'
export type TimeUnit = 'milliseconds' | 'seconds' | 'minutes' | 'hours' | 'days'

/**
 * Get current timestamp in milliseconds.
 *
 * @returns Current timestamp as number
 */
export const now = (): number => {
    return Date.now()
}

/**
 * Get current Unix timestamp.
 *
 * @returns Current Unix timestamp
 */
export const unix = (): number => {
    return Math.floor(Date.now() / 1000)
}

/**
 * Format a date string according to a specified format (UTC-based for determinism).
 *
 * @param date - Date string or Date object
 * @param format - Format to output (default: 'Y-m-d H:i:s')
 * @returns Formatted date string
 */
export const format = (date: string | Date, format: TimeFormat = 'Y-m-d H:i:s'): string => {
    const d = new Date(date)
    
    if (isNaN(d.getTime())) {
        throw new Error('Invalid date provided')
    }
    
    const year = d.getUTCFullYear()
    const month = String(d.getUTCMonth() + 1).padStart(2, '0')
    const day = String(d.getUTCDate()).padStart(2, '0')
    const hours = String(d.getUTCHours()).padStart(2, '0')
    const minutes = String(d.getUTCMinutes()).padStart(2, '0')
    const seconds = String(d.getUTCSeconds()).padStart(2, '0')
    
    const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ]
    const monthNamesShort = [
        'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ]
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    
    switch (format) {
        case 'Y-m-d':
            return `${year}-${month}-${day}`
        case 'Y-m-d H:i:s':
            return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
        case 'd-m-Y':
            return `${day}-${month}-${year}`
        case 'd/m/Y':
            return `${day}/${month}/${year}`
        case 'M j, Y':
            return `${monthNamesShort[d.getUTCMonth()]} ${d.getUTCDate()}, ${year}`
        case 'F j, Y':
            return `${monthNames[d.getUTCMonth()]} ${d.getUTCDate()}, ${year}`
        case 'D j M':
            return `${dayNames[d.getUTCDay()]} ${d.getUTCDate()} ${monthNamesShort[d.getUTCMonth()]}`
        case 'timestamp':
            return d.toISOString()
        case 'unix':
            return Math.floor(d.getTime() / 1000).toString()
        default:
            return d.toISOString()
    }
}

/**
 * Create a date for a given timestamp.
 *
 * @param timestamp - Unix timestamp
 * @returns Date object
 */
export const fromTimestamp = (timestamp: number): Date => {
    return new Date(timestamp * 1000)
}

/**
 * Return the difference for given date in seconds.
 *
 * @param date - Date to compare
 * @param referenceDate - Reference date (optional, defaults to now)
 * @returns Number of seconds difference
 */
export const diff = (date: string | Date, referenceDate?: string | Date): number => {
    const d1 = new Date(date)
    const d2 = referenceDate ? new Date(referenceDate) : new Date()
    
    if (isNaN(d1.getTime()) || isNaN(d2.getTime())) {
        throw new Error('Invalid date provided')
    }
    
    const diffInSeconds = Math.floor((d2.getTime() - d1.getTime()) / 1000)
    return diffInSeconds
}

/**
 * Subtract time from the given date.
 */
export const subtract = (date: string | Date, amount: number = 1, unit: TimeUnit = 'days'): Date => {
    const d = new Date(date)
    if (isNaN(d.getTime())) throw new Error('Invalid date provided')
    const amounts: Record<TimeUnit, number> = {
        milliseconds: 1,
        seconds: 1000,
        minutes: 60 * 1000,
        hours: 60 * 60 * 1000,
        days: 24 * 60 * 60 * 1000
    }
    const multiplier = amounts[unit] || 1000
    return new Date(d.getTime() - (amount * multiplier))
}

/**
 * Add time to the given date.
 */
export const add = (date: string | Date, amount: number = 1, unit: TimeUnit = 'days'): Date => {
    const d = new Date(date)
    if (isNaN(d.getTime())) throw new Error('Invalid date provided')
    const amounts: Record<TimeUnit, number> = {
        milliseconds: 1,
        seconds: 1000,
        minutes: 60 * 1000,
        hours: 60 * 60 * 1000,
        days: 24 * 60 * 60 * 1000
    }
    const multiplier = amounts[unit] || 1000
    return new Date(d.getTime() + (amount * multiplier))
}

/**
 * Start time of a specific unit.
 */
export const start = (date: string | Date, unit: TimeUnit = 'days'): Date => {
    const d = new Date(date)
    if (isNaN(d.getTime())) throw new Error('Invalid date provided')
    const newDt = new Date(d)
    switch (unit) {
        case 'days': newDt.setHours(0, 0, 0, 0); break
        case 'hours': newDt.setMinutes(0, 0, 0); break
        case 'minutes': newDt.setSeconds(0, 0); break
        case 'seconds': newDt.setMilliseconds(0); break
        case 'milliseconds': break
    }
    return newDt
}

/**
 * End time of a specific unit.
 */
export const end = (date: string | Date, unit: TimeUnit = 'days'): Date => {
    const d = new Date(date)
    if (isNaN(d.getTime())) throw new Error('Invalid date provided')
    const newDt = new Date(d)
    switch (unit) {
        case 'days': newDt.setHours(23, 59, 59, 999); break
        case 'hours': newDt.setMinutes(59, 59, 999); break
        case 'minutes': newDt.setSeconds(59, 999); break
        case 'seconds': newDt.setMilliseconds(999); break
        case 'milliseconds': break
    }
    return newDt
}

/**
 * Get the difference in days from today.
 */
export const fromNow = (date: string | Date): number => {
    return diff(date) / (24 * 60 * 60)
}

/**
 * Get a random time between the specified hour and minute.
 */
export const randomTime = (
    startHour: number = 9,
    startMinute: number = 0,
    endHour: number = 17,
    endMinute: number = 0
): Date => {
    const today = new Date()
    const startMinutes = startHour * 60 + startMinute
    const endMinutes = endHour * 60 + endMinute
    const randomMinutes = Math.floor(Math.random() * (endMinutes - startMinutes)) + startMinutes
    const hour = Math.floor(randomMinutes / 60)
    const minute = randomMinutes % 60
    const date = new Date(today)
    date.setHours(hour, minute, 0, 0)
    return date
}

/**
 * Check if the current time is between the specified durations.
 */
export const isBetween = (startTime: string, endTime: string): boolean => {
    const now = new Date()
    const currentHours = now.getHours()
    const currentMinutes = now.getMinutes()
    const currentTotalMinutes = currentHours * 60 + currentMinutes
    const parseTime = (timeStr: string) => {
        const [hours, minutes] = timeStr.split(':').map(Number)
        return hours * 60 + minutes
    }
    const startTotalMinutes = parseTime(startTime)
    const endTotalMinutes = parseTime(endTime)
    if (startTotalMinutes <= endTotalMinutes) {
        return currentTotalMinutes >= startTotalMinutes && currentTotalMinutes <= endTotalMinutes
    } else {
        return currentTotalMinutes >= startTotalMinutes || currentTotalMinutes <= endTotalMinutes
    }
}

/** Day of year, first/last day of month, leap year checks. */
export const dayOfYear = (date: string | Date = new Date()): number => {
    const d = new Date(date)
    const start = new Date(Date.UTC(d.getUTCFullYear(), 0, 0))
    const diff = d.getTime() - start.getTime()
    return Math.floor(diff / (1000 * 60 * 60 * 24))
}

export const firstDayOfMonth = (date: string | Date = new Date()): Date => {
    const d = new Date(date)
    return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1))
}

export const lastDayOfMonth = (date: string | Date = new Date()): Date => {
    const d = new Date(date)
    return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0))
}

export const isLeapYear = (year: number = new Date().getUTCFullYear()): boolean => {
    return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0
}

