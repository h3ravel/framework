import chalk, { type ChalkInstance } from 'chalk'

export class Logger {
    /**
     * Logs the message in two columns
     * @param name 
     * @param value 
     * @param log If set to false, array of [name, dots, value] output will be returned and not logged 
     * @returns 
     */
    static twoColumnLog (name: string, value: string, log?: true): void
    static twoColumnLog (name: string, value: string, log?: false): [string, string, string]
    static twoColumnLog (name: string, value: string, log = true): [string, string, string] | void {
        // eslint-disable-next-line no-control-regex
        const regex = /\x1b\[\d+m/g
        const width = Math.min(process.stdout.columns, 100)
        const dots = Math.max(width - name.replace(regex, '').length - value.replace(regex, '').length - 10, 0)

        if (log) return console.log(name, chalk.gray('.'.repeat(dots)), value)
        else return [name, chalk.gray('.'.repeat(dots)), value]
    }

    /**
     * Logs the message in two columns but allways passing status
     * 
     * @param name 
     * @param value 
     * @param status 
     * @param exit 
     * @param preserveCol 
     */
    static split (name: string, value: string, status?: 'success' | 'info' | 'error', exit = false, preserveCol = false) {
        status ??= 'info'
        const color = { success: chalk.bgGreen, info: chalk.bgBlue, error: chalk.bgRed }

        const [_name, dots, val] = this.twoColumnLog(name, value, false)

        console.log(this.textFormat(_name, color[status], preserveCol), dots, val)

        if (exit) process.exit(0)
    }

    /**
     * Wraps text with chalk
     * 
     * @param txt 
     * @param color 
     * @param preserveCol 
     * @returns 
     */
    static textFormat (txt: any, color: (txt: string) => string, preserveCol = false) {
        if (preserveCol) return String(txt)
        return String(txt).split(':').map((e, i, a) => i == 0 && a.length > 1 ? color(' ' + e + ': ') : e).join('')
    }

    /**
     * Logs a success message
     * 
     * @param msg 
     * @param exit 
     * @param preserveCol 
     */
    static success (msg: any, exit = false, preserveCol = false) {
        console.log(chalk.green('✓'), this.textFormat(msg, chalk.bgGreen, preserveCol), '\n')
        if (exit) process.exit(0)
    }

    /**
     * Logs an informational message
     * 
     * @param msg 
     * @param exit 
     * @param preserveCol 
     */
    static info (msg: any, exit = false, preserveCol = false) {
        console.log(chalk.blue('ℹ'), this.textFormat(msg, chalk.bgBlue, preserveCol), '\n')
        if (exit) process.exit(0)
    }

    /**
     * Logs an error message
     * 
     * @param msg 
     * @param exit 
     * @param preserveCol 
     */
    static error (msg: string | string[] | Error & { detail?: string }, exit = true, preserveCol = false) {
        if (msg instanceof Error) {
            if (msg.message) {
                console.error(chalk.red('✖'), this.textFormat('ERROR:' + msg.message, chalk.bgRed, preserveCol))
            }
            console.error(chalk.red(`${msg.detail ? `${msg.detail}\n` : ''}${msg.stack}`), '\n')
        }
        else {
            console.error(chalk.red('✖'), this.textFormat(msg, chalk.bgRed, preserveCol), '\n')
        }
        if (exit) process.exit(1)
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
     * @param log If set to false, string output will be returned and not logged 
     */
    static parse (config: [string, keyof ChalkInstance][], joiner?: string, log?: true): void
    static parse (config: [string, keyof ChalkInstance][], joiner?: string, log?: false): string
    static parse (config: [string, keyof ChalkInstance][], joiner = ' ', log = true): string | void {
        const string = config.map(([str, opt]) => {
            return typeof chalk[opt] === 'function' ? (chalk as any)[opt](str) : str
        }).join(joiner)

        if (log) console.log(string)
        else return string
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
