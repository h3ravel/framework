import chalk, { type ChalkInstance } from 'chalk'

export class Logger {
    /**
     * Logs the message in two columns
     * @param name 
     * @param value 
     * @returns 
     */
    static twoColumnLog (name: string, value: string) {
        // eslint-disable-next-line no-control-regex
        const regex = /\x1b\[\d+m/g
        const width = Math.min(process.stdout.columns, 100)
        const dots = Math.max(width - name.replace(regex, '').length - value.replace(regex, '').length - 10, 0)
        return console.log(name, chalk.gray('.'.repeat(dots)), value)
    }

    /**
     * Wraps text with chalk
     * 
     * @param txt 
     * @param color 
     * @returns 
     */
    static textFormat (txt: any, color: (txt: string) => string) {
        return String(txt).split(':').map((e, i, a) => i == 0 && a.length > 1 ? color(' ' + e + ': ') : e).join('')
    }

    /**
     * Logs a success message
     * 
     * @param msg 
     * @param exit 
     */
    static success (msg: any, exit = false) {
        console.log(chalk.green('✓'), this.textFormat(msg, chalk.bgGreen), '\n')
        if (exit) process.exit(0)
    }

    /**
     * Logs an informational message
     * 
     * @param msg 
     * @param exit 
     */
    static info (msg: any, exit = false) {
        console.log(chalk.blue('ℹ'), this.textFormat(msg, chalk.bgBlue), '\n')
        if (exit) process.exit(0)
    }

    /**
     * Logs an error message
     * 
     * @param msg 
     * @param exit 
     */
    static error (msg: string | string[] | Error & { detail?: string }, exit = true) {
        if (msg instanceof Error) {
            if (msg.message) {
                console.error(chalk.red('✖'), this.textFormat('ERROR:' + msg.message, chalk.bgRed))
            }
            console.error(chalk.red(`${msg.detail ? `${msg.detail}\n` : ''}${msg.stack}`), '\n')
        }
        else {
            console.error(chalk.red('✖'), this.textFormat(msg, chalk.bgRed), '\n')
        }
        if (exit) process.exit(1)
    }

    /**
     * Logs a success message
     * 
     * @param name 
     * @param value 
     * @param status 
     * @param exit 
     */
    static split (name: string, value: string, status?: 'success' | 'info' | 'error', exit = false) {
        status ??= 'info'
        const color = { success: chalk.bgGreen, info: chalk.bgBlue, error: chalk.bgRed }
        const regex = /\x1b\[\d+m/g
        const width = Math.min(process.stdout.columns, 100)
        const dots = Math.max(width - name.replace(regex, '').length - value.replace(regex, '').length - 10, 0)

        console.log(this.textFormat(name, color[status]), chalk.gray('.'.repeat(dots)), value)
        if (exit) process.exit(0)
    }

    /**
     * Terminates the process
     */
    static quiet () {
        process.exit(0)
    }

    /**
     * Parse an array formated message and logs it
     * 
     * @param config 
     * @param joiner 
     */
    static parse (config: [string, keyof ChalkInstance][], joiner = ' ') {
        const string = config.map(([str, opt]) => {
            return typeof chalk[opt] === 'function' ? (chalk as any)[opt](str) : str
        }).join(joiner)

        console.log(string)
    }

    /**
     * Ouput formater object or format the output
     * 
     * @returns 
     */
    static log (): typeof Logger
    static log (config: string, joiner: keyof ChalkInstance): void
    static log (config: [string, keyof ChalkInstance][], joiner?: string): void
    static log (config?: string | [string, keyof ChalkInstance][], joiner?: string): void | Logger {
        if (typeof config === 'string') {
            const conf = [[config, joiner]] as [string, keyof ChalkInstance][]
            return this.parse(conf)
        } else if (config) {
            return this.parse(config, joiner)
        }
        return this
    }
}
