import type { Argument, Command } from 'commander'

import { Application } from '../Application'
import { ConsoleKernel } from './ConsoleKernel'
import { Logger } from '@h3ravel/shared'
import { XGeneric } from '@h3ravel/support'

export class ConsoleCommand {
    constructor(protected app: Application, protected kernel: ConsoleKernel) { }

    /**
     * The underlying commander instance.
     *
     * @var Command
     */
    public program!: Command

    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected signature!: string

    /**
     * A dictionary of signatures or what not.
     *
     * @var object
     */
    protected dictionary: Record<string, any> = {}

    /**
     * The console command description.
     *
     * @var string
     */
    protected description?: string

    /**
     * The console command input.
     *
     * @var object
     */
    private input: XGeneric<{ options: Record<string, any>, arguments: Record<string, any> }> = {
        options: {},
        arguments: {},
    }

    /**
     * Execute the console command.
     */
    public async handle (..._args: any[]): Promise<void> { }

    setApplication (app: Application) {
        this.app = app
    }

    setInput (
        options: XGeneric,
        args: string[],
        regArgs: readonly Argument[],
        dictionary: Record<string, any>,
        program: Command,
    ) {
        this.program = program
        this.dictionary = dictionary
        this.input.options = options
        this.input.arguments = regArgs
            .map((e, i) => ({ [e.name()]: args[i] }))
            .reduce((e, x) => Object.assign(e, x), {})
        this.loadBaseFlags()

        Logger.configure({
            verbosity: this.option('verbose'),
            silent: this.option('silent'),
            quiet: this.option('quiet'),
        })
    }

    getSignature () {
        return this.signature
    }

    getDescription () {
        return this.description
    }

    option (key: string, def?: any) {
        const option = this.input.options[key] ?? def
        return option === 'null' || option === 'undefined' ? undefined : option
    }

    options (key?: string) {
        if (key) {
            return this.input.options[key]
        }
        return this.input.options
    }

    argument (key: string, def?: any) {
        return this.input.arguments[key] ?? def
    }

    arguments () {
        return this.input.arguments
    }

    private loadBaseFlags () {
        this.input.options.lock = this.program.getOptionValue('lock') ?? false
        this.input.options.quiet = this.program.getOptionValue('quiet') ?? false
        this.input.options.silent = this.program.getOptionValue('silent') ?? false
        this.input.options.verbose = this.program.getOptionValue('verbose') ?? 0
    }

    /**
     * Check if the command is quiet
     * 
     * @returns 
     */
    isQuiet () {
        return this.option('quiet')
    }

    /**
     * Check if the command is silent
     * 
     * @returns 
     */
    isSilent () {
        return this.option('silent')
    }

    /**
     * Check if the command is non interactive
     * 
     * @returns 
     */
    isNonInteractive () {
        return this.option('no-interaction') || this.option('noInteraction')
    }

    /**
     * Get the verbosity of the command
     * 
     * @returns 
     */
    getVerbosity (): string {
        return this.option('verbose')
    }

    /**
     * Log an info message
     */
    info (message: string) {
        Logger.info(message)
        return this
    }

    /**
     * Log a warning message
     */
    warn (message: string) {
        Logger.warn(message)
        return this
    }

    /**
     * Log a line message
     */
    line (message: string) {
        Logger.log(message, 'white')
        return this
    }

    /**
     * Log a new line
     */
    newLine (count: number = 1) {
        if (Number(this.getVerbosity()) >= 3 || (!this.isSilent() && !this.isQuiet()))
            for (let i = 0; i < count; i++)
                console.log('')
        return this
    }

    /**
     * Log a success message
     */
    success (message: string) {
        Logger.success(message)
        return this
    }

    /**
     * Log an error message
     */
    error (message: string) {
        Logger.error(message)
        return this
    }

    /**
     * Log a debug message
     */
    debug (message: string | string[]) {
        Logger.debug(message)
        return this
    }
}
