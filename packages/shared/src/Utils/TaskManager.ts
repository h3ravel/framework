import { Logger } from './Logger'

export class TaskManager {
    public static async taskRunner (
        description: string,
        task: (() => Promise<any>) | (() => any)
    ): Promise<void> {
        const startTime = process.hrtime()
        let result: any = false

        try {
            result = await Promise.all([(task || (() => true))()].flat())
        } finally {
            const endTime = process.hrtime(startTime)
            const duration = (endTime[0] * 1e9 + endTime[1]) / 1e6
            Logger.twoColumnDetail(
                Logger.parse([[description, 'green']], '', false),
                [
                    Logger.parse([[`${Math.floor(duration)}ms`, 'gray']], '', false),
                    Logger.parse([[result !== false ? '✔' : '✘', result !== false ? 'green' : 'red']], '', false),
                ].join(' ')
            )
        }
    }

    public static async advancedTaskRunner<R = any> (
        info: [[string, string], [string, string]] | [[string, string]],
        task: (() => Promise<R>) | (() => R)
    ): Promise<R | undefined> {
        const startTime = process.hrtime()
        const [startInfo, stopInfo] = info

        if (stopInfo) {
            Logger.twoColumnDetail(startInfo[0], Logger.log(startInfo[1], ['yellow', 'bold'], false))
        }

        try {
            return await Promise.race([task()])
        } catch (e: any) {
            Logger.error('ERROR: ' + e.message)
        } finally {
            const endTime = process.hrtime(startTime)
            const duration = (endTime[0] * 1e9 + endTime[1]) / 1e6

            Logger.twoColumnDetail(
                stopInfo?.[0] ?? startInfo[0],
                [
                    Logger.parse([[`${Math.floor(duration)}ms`, 'gray']], '', false),
                    Logger.parse([[`✔ ${stopInfo?.[1] ?? startInfo[1]}`, ['green', 'bold']]], '', false),
                ].join(' ')
            )
        }
    }
}
