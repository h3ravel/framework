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
            Logger.twoColumnLog(
                Logger.parse([[description, 'green']], '', false),
                [
                    Logger.parse([[`${Math.floor(duration)}ms`, 'gray']], '', false),
                    Logger.parse([[result !== false ? '✔' : '✘', result !== false ? 'green' : 'red']], '', false),
                ].join(' ')
            )
        }
    }
}
