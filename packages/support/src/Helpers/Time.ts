import dayjs, { ConfigType, Dayjs, OpUnitType, OptionType, QUnitType } from 'dayjs'

import advancedFormat from 'dayjs/plugin/advancedFormat.js'
import customParseFormat from 'dayjs/plugin/customParseFormat.js'
import dayOfYear from 'dayjs/plugin/dayOfYear.js'
import isBetween from 'dayjs/plugin/isBetween.js'
import isLeapYear from 'dayjs/plugin/isLeapYear.js'
import relativeTime from 'dayjs/plugin/relativeTime.js'
import timezone from 'dayjs/plugin/timezone.js'
import utc from 'dayjs/plugin/utc.js'

// dayjs.extend(duration)
dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(dayOfYear)
dayjs.extend(isBetween)
dayjs.extend(isLeapYear)
dayjs.extend(relativeTime)
dayjs.extend(advancedFormat)
dayjs.extend(customParseFormat)

const phpToDayjsTokens = (format: string): string => format
    .replace(/Y/g, 'YYYY')
    .replace(/m/g, 'MM')
    .replace(/d/g, 'DD')
    .replace(/H/g, 'HH')
    .replace(/i/g, 'mm')
    .replace(/s/g, 'ss')

export function format (date: ConfigType, fmt: string) {
    return dayjs(date).format(phpToDayjsTokens(fmt))
}

// export interface Time extends Dayjs { }
const TimeClass = class { } as { new(date?: any): Dayjs } & typeof Dayjs

export class DateTime extends TimeClass {
    private instance: Dayjs

    constructor(config?: ConfigType | DateTime)
    constructor(config?: ConfigType | DateTime, format?: OptionType, locale?: boolean)
    constructor(config?: ConfigType | DateTime, format?: OptionType, locale?: string | boolean, strict?: boolean) {
        super(config)

        if (config instanceof DateTime) {
            config = config.instance
        }

        this.instance = dayjs(config, format, locale as never, strict)
        return new Proxy(this, {
            get: (target, prop, receiver) => {
                if (prop in target) return Reflect.get(target, prop, receiver)

                const value = Reflect.get(this.instance, prop, receiver)
                if (typeof value === 'function') {
                    return (...args: any[]) => {
                        const result = value.apply(this.instance, args)
                        // If result is Dayjs, wrap in Time
                        return dayjs.isDayjs(result) ? new DateTime(result) : result
                    }
                }
                return value
            }
        })
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
     * Set the timezone for the instance
     * 
     * @param timezone 
     * @returns 
     */
    setTimezone (timezone?: string | undefined, keepLocalTime?: boolean | undefined) {
        return new DateTime(this.tz(timezone, keepLocalTime))
    }

    /**
     * Returns a cloned Day.js object with a specified amount of time added.
     * ```
     * dayjs().add(7, 'day')// => Dayjs
     * ```
     * Units are case insensitive, and support plural and short forms.
     *
     * Docs: https://day.js.org/docs/en/manipulate/add
     * 
     * @alias dayjs().add()
     */
    // @ts-expect-error plugin conflict, safe to ignore
    add (value: number, unit?: dayjs.ManipulateType | undefined) {
        return new DateTime(this.instance.add(value, unit))
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
     * This indicates the difference between two date-time in the specified unit.
     *
     * To get the difference in milliseconds, use `dayjs#diff`
     * ```
     * const date1 = dayjs('2019-01-25')
     * const date2 = dayjs('2018-06-05')
     * date1.diff(date2) // 20214000000 default milliseconds
     * date1.diff() // milliseconds to current time
     * ```
     *
     * To get the difference in another unit of measurement, pass that measurement as the second argument.
     * ```
     * const date1 = dayjs('2019-01-25')
     * date1.diff('2018-06-05', 'month') // 7
     * ```
     * Units are case insensitive, and support plural and short forms.
     *
     * Docs: https://day.js.org/docs/en/display/difference
     */
    diff (date?: string | number | Dayjs | DateTime | Date | null | undefined, unit?: QUnitType | OpUnitType, float?: boolean) {
        if (date instanceof DateTime) {
            date = date.instance
        }
        return this.instance.diff(date, unit, float)
    }

    /**
     * Get the first day of the month of the given date
     * 
     * @returns 
     */
    firstDayOfMonth (): DateTime {
        return new DateTime(new Date(Date.UTC(this.year(), this.month(), 1)))
    }

    carbonFormat (template?: string | undefined) {
        return template ? this.format(phpToDayjsTokens(template)) : this.format()
    }

    /**
     * This returns the Unix timestamp (the number of **seconds** since the Unix Epoch) of the Day.js object.
     * ```
     * dayjs('2019-01-25').unix() // 1548381600
     * ```
     * This value is floored to the nearest second, and does not include a milliseconds component.
     *
     * Docs: https://day.js.org/docs/en/display/unix-timestamp
     * 
     * @alias dayjs('2019-01-25').unix()
     */
    getTimestamp () {
        return this.instance.unix()
    }

    /**
     * Get the last day of the month of the given date
     * 
     * @returns 
     */
    lastDayOfMonth (): DateTime {
        return new DateTime(new Date(Date.UTC(this.year(), this.month() + 1, 0)))
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
    ): DateTime {
        const today = new Date()
        const startMinutes = startHour * 60 + startMinute
        const endMinutes = endHour * 60 + endMinute
        const randomMinutes = Math.floor(Math.random() * (endMinutes - startMinutes)) + startMinutes
        const hour = Math.floor(randomMinutes / 60)
        const minute = randomMinutes % 60
        const date = new Date(today)
        date.setHours(hour, minute, 0, 0)
        return new DateTime(date)
    }

    /**
     * Create a date for a given timestamp.
     *
     * @param timestamp - Unix timestamp
     * 
     * @return {Date} object
     */
    static fromTimestamp (timestamp: number): DateTime {
        return new DateTime(timestamp * 1000)
    }

    /**
     * Get current time instance.
     *
     * @returns Current time
     */
    static now (): DateTime {
        return new DateTime()
    }

    /**
     * Parse the time
     * 
     * @param date 
     * @returns 
     */
    static parse (date: dayjs.ConfigType): DateTime {
        return new DateTime(date)
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
        return new DateTime(time).format(template)
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
    static randomTime (
        time?: ConfigType,
        startHour?: number,
        startMinute?: number,
        endHour?: number,
        endMinute?: number
    ): DateTime {
        return new DateTime(time).randomTime(startHour, startMinute, endHour, endMinute)
    }

    /**
     * Use a dayjs plugin
     * 
     * @param plugin 
     * @param option 
     * @returns 
     */
    static plugin<T = unknown> (plugin: dayjs.PluginFunc<T>, option?: T | undefined): typeof dayjs {
        dayjs.extend<T>(plugin, option)
        return dayjs
    }

    /**
     * Get the first day of the month of the given date
     * 
     * @param time 
     * 
     * @returns 
     */
    static firstDayOfMonth (time: ConfigType): DateTime {
        return new DateTime(time).firstDayOfMonth()
    }

    /**
     * Get the last day of the month of the given date
     * 
     * @param time 
     * 
     * @returns 
     */
    static lastDayOfMonth (time: ConfigType): DateTime {
        return new DateTime(time).lastDayOfMonth()
    }
}
