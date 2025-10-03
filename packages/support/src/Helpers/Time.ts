import dayjs, { ConfigType, Dayjs, OpUnitType } from 'dayjs'

import advancedFormat from 'dayjs/plugin/advancedFormat'
import customParseFormat from 'dayjs/plugin/customParseFormat'
import dayOfYear from 'dayjs/plugin/dayOfYear'
import isBetween from 'dayjs/plugin/isBetween'
import isLeapYear from 'dayjs/plugin/isLeapYear'
import relativeTime from 'dayjs/plugin/relativeTime'
import timezone from 'dayjs/plugin/timezone'
import utc from 'dayjs/plugin/utc'

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
const TimeClass = class { } as { new(date?: dayjs.ConfigType): Dayjs } & typeof Dayjs

export class Time extends TimeClass {
    private instance: Dayjs

    constructor(config?: ConfigType) {
        super(config)

        this.instance = dayjs(config)
        return new Proxy(this, {
            get: (target, prop, receiver) => {
                if (prop in target) return Reflect.get(target, prop, receiver)

                const value = Reflect.get(this.instance, prop, receiver)
                if (typeof value === 'function') {
                    return (...args: any[]) => {
                        const result = value.apply(this.instance, args)
                        // If result is Dayjs, wrap in Time
                        return dayjs.isDayjs(result) ? new Time(result) : result
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
     * End time of a specific unit.
     * 
     * @returns 
     */
    end (unit: OpUnitType = 'days') {
        return this.endOf(unit)
    }

    /**
     * Get the first day of the month of the given date
     * 
     * @returns 
     */
    firstDayOfMonth (): Time {
        return new Time(new Date(Date.UTC(this.year(), this.month(), 1)))
    }

    carbonFormat (template?: string | undefined) {
        return template ? this.format(phpToDayjsTokens(template)) : this.format()
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
     * @return {Date} object
     */
    static fromTimestamp (timestamp: number): Date {
        return new Date(timestamp * 1000)
    }

    /**
     * Get current time instance.
     *
     * @returns Current time
     */
    static now (): Time {
        return new Time()
    }

    /**
     * Parse the time
     * 
     * @param date 
     * @returns 
     */
    static parse (date: dayjs.ConfigType): Time {
        return new Time(date)
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
    ): Time {
        return new Time(time).randomTime(startHour, startMinute, endHour, endMinute)
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
}
