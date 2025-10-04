import { ConsoleCommand } from '@h3ravel/core'
import { Logger } from '@h3ravel/shared'

export class Command extends ConsoleCommand {
    /**
     * Log an info message
     */
    info(message: string): void {
        Logger.info(message)
    }

    /**
     * Log a warning message
     */
    warn(message: string): void {
        Logger.warn(message)
    }

    /**
     * Log a line message
     */
    line(message: string): void {
        Logger.log(message)
    }

    /**
     * Log a new line
     */
    newLine(count: number = 1): void {
        for (let i = 0; i < count; i++) {
            console.log('')
        }
    }

    /**
     * Log a success message
     */
    success(message: string): void {
        Logger.success(message)
    }

    /**
     * Log an error message
     */
    error(message: string): void {
        Logger.error(message)
    }

    /**
     * Log a debug message
     */
    debug(message: string): void {
        Logger.debug(message)
    }
}
