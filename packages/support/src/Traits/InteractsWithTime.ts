import { DateTime } from '../Helpers/Time'
import duration from 'dayjs/plugin/duration.js'
import { trait } from '@h3ravel/shared'

export const InteractsWithTime = trait((Base) => class InteractsWithTime extends Base {
    /**
     * Get the number of seconds until the given DateTime.
     *
     * @param  delay
     */
    secondsUntil (delay: DateTime | number) {
        delay = this.parseDateInterval(delay)

        return delay instanceof DateTime
            ? Math.max(0, delay.getTimestamp() - this.currentTime())
            : Number(delay)
    }

    /**
     * Get the "available at" UNIX timestamp.
     *
     * @param  delay
     */
    availableAt (delay: DateTime | number = 0) {
        delay = this.parseDateInterval(delay)

        return delay instanceof DateTime
            ? delay.getTimestamp()
            : DateTime.now().add(delay, 'seconds').getTimestamp()
    }

    /**
     * If the given value is an interval, convert it to a DateTime instance.
     *
     * @param  delay
     */
    parseDateInterval (delay: DateTime | number) {
        if (typeof delay === 'number') {
            delay = DateTime.now().add(delay)
        }

        return delay
    }

    /**
     * Get the current system time as a UNIX timestamp.
     */
    currentTime () {
        return DateTime.now().getTimestamp()
    }

    /**
     * Given a start time, format the total run time for human readability.
     *
     * @param  startTime
     * @param  endTime
     */
    runTimeForHumans (startTime: number, endTime?: number): string {
        endTime ??= Date.now()

        const runTime = endTime - startTime

        if (runTime < 1000) return `${runTime.toFixed(2)}ms`

        return DateTime.plugin(duration).duration(runTime).humanize()
    }
})