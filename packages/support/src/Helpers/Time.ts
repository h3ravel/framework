import dayjs, { ConfigType, Dayjs, ManipulateType, OpUnitType, QUnitType } from 'dayjs'

import dayOfYear from 'dayjs/plugin/dayOfYear'
import isBetween from 'dayjs/plugin/isBetween'
import isLeapYear from 'dayjs/plugin/isLeapYear'

export type TimeFormat = string
export type TimeUnit = 'milliseconds' | 'seconds' | 'minutes' | 'hours' | 'days'

export class Time extends Dayjs {
    constructor(config?: ConfigType) {
        dayjs.extend(isBetween)
        dayjs.extend(isLeapYear)
        dayjs.extend(dayOfYear)
        super(dayjs(config))
    }

    /**
     * Start time of a specific unit.
     * 
     * @returns 
     */
    start (unit: OpUnitType = 'days') {
        return this.startOf(unit)
    }

    /**
     * End time of a specific unit.
     * 
     * @returns 
     */
    end (unit: OpUnitType = 'days') {
        return this.endOf(unit)
    }

    /**
     * Get current timestamp in milliseconds.
     *
     * @returns Current timestamp as number
     */
    now (): number {
        return Date.now()
    }

    /**
     * Get the difference in days from today.
     * 
     * @returns 
     */
    fromNow (): number {
        return this.diff(new Date()) / (24 * 60 * 60)
    }

    /**
     * Get the first day of the month of the given date
     * 
     * @returns 
     */
    firstDayOfMonth (): Time {
        return new Time(new Date(Date.UTC(this.year(), this.month(), 1)))
    }

    /**
     * Get the last day of the month of the given date
     * 
     * @returns 
     */
    lastDayOfMonth (): Time {
        return new Time(new Date(Date.UTC(this.year(), this.month() + 1, 0)))
    }

    /**
     * Get a random time between the specified hour and minute.
     * 
     * @param startHour 
     * @param startMinute 
     * @param endHour 
     * @param endMinute 
     * @returns 
     */
    randomTime (
        startHour: number = 9,
        startMinute: number = 0,
        endHour: number = 17,
        endMinute: number = 0
    ): Time {
        const today = new Date()
        const startMinutes = startHour * 60 + startMinute
        const endMinutes = endHour * 60 + endMinute
        const randomMinutes = Math.floor(Math.random() * (endMinutes - startMinutes)) + startMinutes
        const hour = Math.floor(randomMinutes / 60)
        const minute = randomMinutes % 60
        const date = new Date(today)
        date.setHours(hour, minute, 0, 0)
        return new Time(date)
    }

    /**
     * Create a date for a given timestamp.
     *
     * @param timestamp - Unix timestamp
     * 
     * @return {Time} object
     */
    static fromTimestamp (timestamp: number): Time {
        return new Time(new Date(timestamp * 1000))
    }

    /**
     * Get current timestamp in milliseconds.
     *
     * @returns Current timestamp as number
     */
    static now (): number {
        return Date.now()
    }

    /**
     * This returns the Unix timestamp (the number of seconds since the Unix Epoch) of the Time object.
     *
     * @param time - current time
     */
    static unix (time?: ConfigType): number {
        return new Time(time).unix()
    }

    /**
     * Get the formatted date according to the string of tokens passed in.
     * 
     * To escape characters, wrap them in square brackets (e.g. [MM]).
     *
     * @param time - current time
     * @param template - time format
     */
    static format (time?: ConfigType, template?: string | undefined): string {
        return new Time(time).format(template)
    }

    /**
     * This indicates the difference between two date-time in the specified unit.
     * 
     * To get the difference in milliseconds, use dayjs#diff
     *
     * @param time 
     * @param date 
     * @param unit 
     * @param float 
     */
    static diff (time?: ConfigType, date?: ConfigType, unit?: QUnitType | OpUnitType, float?: boolean): number {
        return new Time(time).diff(date, unit, float)
    }

    /**
     * Returns a cloned Time object with a specified amount of time added
     *
     * @param time 
     * @param value 
     * @param unit 
     * @returns 
     */
    static add (time: ConfigType, value: number, unit?: ManipulateType | undefined): Time {
        return new Time((dayjs(time).add(value, unit)))
    }

    /**
     * Returns a cloned Time object with a specified amount of time subtracted.
     *
     * @param time 
     * @param value 
     * @param unit 
     * @returns 
     */
    static subtract (time: ConfigType, value: number, unit?: ManipulateType | undefined): Time {
        return new Time((dayjs(time).subtract(value, unit)))
    }

    /**
     * Get the difference in days from today.
     *
     * @param time 
     * @param date 
     * @param unit 
     * @param float 
     */
    static fromNow (time?: ConfigType): number {
        return new Time(time).fromNow()
    }

    /**
     * Get the difference in days from today.
     *
     * @param time 
     * @param startHour 
     * @param startMinute 
     * @param endHour 
     * @param endMinute 
     * @returns 
     */
    static randomTime (time?: ConfigType, startHour?: number, startMinute?: number, endHour?: number, endMinute?: number): Time {
        return new Time(time).randomTime(startHour, startMinute, endHour, endMinute)
    }

    /**
     * @param time 
     * @param a 
     * @param b 
     * @param c 
     * @param d 
     * @returns 
     */
    static isBetween (
        time: ConfigType,
        a: string | number | dayjs.Dayjs | Date | null | undefined,
        b: ConfigType,
        c?: OpUnitType | null,
        d?: '()' | '[]' | '[)' | '(]'
    ): boolean {
        return new Time(time).isBetween(a, b, c, d)
    }

    /**
     * @param time 
     * @param a 
     * @param b 
     * @param c 
     * @param d 
     * @returns 
     */
    static dayOfYear (time: ConfigType): number
    static dayOfYear (time: ConfigType, value: number): Time
    static dayOfYear (time: ConfigType, value?: number): Time | number {
        const output = new Time(time).dayOfYear(value!)
        return value ? new Time(output) : Number(output)
    }

    /**
     * Get the first day of the month of the given date
     * 
     * @param time 
     * 
     * @returns 
     */
    static firstDayOfMonth (time: ConfigType): Time {
        return new Time(time).firstDayOfMonth()
    }

    /**
     * Get the last day of the month of the given date
     * 
     * @param time 
     * 
     * @returns 
     */
    static lastDayOfMonth (time: ConfigType): Time {
        return new Time(time).lastDayOfMonth()
    }

    /**
     * Checks if the given date is in a leap year
     * 
     * @param time 
     * 
     * @returns 
     */
    static isLeapYear (time: ConfigType): boolean {
        return new Time(time).isLeapYear()
    }
}
