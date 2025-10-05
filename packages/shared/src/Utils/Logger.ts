import chalk, { type ChalkInstance } from 'chalk'
import { LoggerChalk, LoggerLog, LoggerParseSignature } from '../Contracts/Utils'

export class Logger {
    /**
     * Global verbosity configuration
     */
    private static verbosity: number = 0
    private static isQuiet: boolean = false
    private static isSilent: boolean = false

    /**
     * Configure global verbosity levels
     */
    static configure (options: { verbosity?: number, quiet?: boolean, silent?: boolean } = {}) {
        this.verbosity = options.verbosity ?? 0
        this.isQuiet = options.quiet ?? false
        this.isSilent = options.silent ?? false
    }

    /**
     * Check if output should be suppressed
     */
    private static shouldSuppressOutput (level: 'debug' | 'info' | 'warn' | 'error' | 'success'): boolean {
        if (this.isSilent) return true
        if (this.isQuiet && (level === 'info' || level === 'success')) return true
        if (level === 'debug' && this.verbosity < 3) return true
        return false
    }
    /**
     * Logs the message in two columns
     * 
     * @param name 
     * @param value 
     * @param log If set to false, array of [name, dots, value] output will be returned and not logged 
     * @returns 
     */
    static twoColumnDetail (name: string, value: string, log?: true, spacer?: string): void
    static twoColumnDetail (name: string, value: string, log?: false, spacer?: string): [string, string, string]
    static twoColumnDetail (name: string, value: string, log = true, spacer = '.'): [string, string, string] | void {
        // eslint-disable-next-line no-control-regex
        const regex = /\x1b\[\d+m/g
        const width = Math.max(process.stdout.columns, 100)
        const dots = Math.max(width - name.replace(regex, '').length - value.replace(regex, '').length - 10, 0)

        if (log) return console.log(name, chalk.gray(spacer.repeat(dots)), value)
        else return [name, chalk.gray(spacer.repeat(dots)), value]
    }

    /**
     * Logs the message in two columns
     * 
     * @param name 
     * @param desc 
     * @param width 
     * @param log If set to false, array of [name, dots, value] output will be returned and not logged 
     * @returns 
     */
    static describe (name: string, desc: string, width?: number, log?: true): void
    static describe (name: string, desc: string, width?: number, log?: false): [string, string, string]
    static describe (name: string, desc: string, width = 50, log = true): [string, string, string] | void {
        width = Math.min(width, 30)
        // eslint-disable-next-line no-control-regex
        const regex = /\x1b\[\d+m/g
        const dots = Math.max(width - name.replace(regex, '').length, 0)

        if (log) return console.log(name, ' '.repeat(dots), desc)
        else return [name, ' '.repeat(dots), desc]
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

        const [_name, dots, val] = this.twoColumnDetail(name, value, false)

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
    static textFormat (
        txt: unknown,
        color: (txt: string) => string,
        preserveCol = false
    ): string {
        const str = String(txt)

        if (preserveCol) return str

        const [first, ...rest] = str.split(':')
        if (rest.length === 0) return str

        return color(` ${first} `) + rest.join(':')
    }

    /**
     * Logs a success message
     * 
     * @param msg 
     * @param exit 
     * @param preserveCol 
     */
    static success (msg: any, exit = false, preserveCol = false) {
        if (!this.shouldSuppressOutput('success')) {
            console.log(chalk.green('✓'), this.textFormat(msg, chalk.bgGreen, preserveCol))
        }
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
        if (!this.shouldSuppressOutput('info')) {
            console.log(chalk.blue('ℹ'), this.textFormat(msg, chalk.bgBlue, preserveCol))
        }
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
        if (!this.shouldSuppressOutput('error')) {
            if (msg instanceof Error) {
                if (msg.message) {
                    console.error(chalk.red('✖'), this.textFormat('ERROR:' + msg.message, chalk.bgRed, preserveCol))
                }
                console.error(chalk.red(`${msg.detail ? `${msg.detail}\n` : ''}${msg.stack}`))
            }
            else {
                console.error(chalk.red('✖'), this.textFormat(msg, chalk.bgRed, preserveCol))
            }
        }
        if (exit) process.exit(1)
    }

    /**
     * Logs a warning message
     * 
     * @param msg 
     * @param exit 
     * @param preserveCol 
     */
    static warn (msg: any, exit = false, preserveCol = false) {
        if (!this.shouldSuppressOutput('warn')) {
            console.warn(chalk.yellow('⚠'), this.textFormat(msg, chalk.bgYellow, preserveCol))
        }
        if (exit) process.exit(0)
    }

    /**
     * Logs a debug message (only shown with verbosity >= 3)
     * 
     * @param msg 
     * @param exit 
     * @param preserveCol 
     */
    static debug<M = any> (msg: M | M[], exit = false, preserveCol = false) {
        if (!this.shouldSuppressOutput('debug')) {
            if (Array.isArray(msg)) {
                for (let i = 0; i < msg.length; i++) {
                    console.log(chalk.bgGray(i + 1), chalk.gray('🐛'), this.textFormat(msg[i], chalk.bgGray, preserveCol), '\n')
                }
            } else {
                console.log(chalk.gray('🐛'), this.textFormat(msg, chalk.bgGray, preserveCol))
            }
        }
        if (exit) process.exit(0)
    }

    /**
     * Terminates the process
     */
    static quiet () {
        process.exit(0)
    }

    static chalker (styles: LoggerChalk[]) {
        return (input: any): string =>
            styles.reduce((acc, style) => {
                if ((style as any) in chalk) {
                    const fn = typeof style === 'function'
                        ? style
                        : chalk[style as never]
                    return fn(acc)
                }
                return acc
            }, input)
    }

    /**
     * Parse an array formated message and logs it
     * 
     * @param config 
     * @param joiner 
     * @param log If set to false, string output will be returned and not logged 
     * @param sc color to use ue on split text if : is found 
     */
    static parse (config: LoggerParseSignature, joiner?: string, log?: true, sc?: LoggerChalk): void
    static parse (config: LoggerParseSignature, joiner?: string, log?: false, sc?: LoggerChalk): string
    static parse (config: LoggerParseSignature, joiner = ' ', log = true, sc?: LoggerChalk): string | void {
        const string = config.map(([str, opt]) => {
            if (Array.isArray(opt)) {
                opt = Logger.chalker(opt) as ChalkInstance
            }

            const output = typeof opt === 'string' && typeof chalk[opt] === 'function'
                ? (chalk as any)[opt](str)
                : typeof opt === 'function' ? opt(str) : str

            if (!sc) {
                return output
            }

            return this.textFormat(output, Logger.chalker(Array.isArray(sc) ? sc : [sc]))
        }).join(joiner)

        if (log) console.log(string)
        else return string
    }

    /**
     * Ouput formater object or format the output
     * 
     * @returns 
     */
    public static log: LoggerLog = ((config, joiner, log: boolean = true, sc) => {
        if (typeof config === 'string') {
            const conf = [[config, joiner]] as [string, keyof ChalkInstance][]
            return this.parse(conf, '', log as false, sc)
        } else if (config) {
            return this.parse(config, String(joiner), log as false, sc)
        }

        return this
    }) as LoggerLog
}
