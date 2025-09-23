import type { Argument, Command } from "commander";

import { Application } from "../Application";
import { ConsoleKernel } from "./ConsoleKernel";
import { XGeneric } from "@h3ravel/support";

export class ConsoleCommand {
    constructor(protected app: Application, protected kernel: ConsoleKernel) { }

    /**
     * The underlying commander instance.
     *
     * @var Command
     */
    public program!: Command;

    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected signature!: string;

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
    protected description?: string;

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
    }

    getSignature () {
        return this.signature
    }

    getDescription () {
        return this.description
    }

    option (key: string, def?: any) {
        return this.input.options[key] ?? def
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
}
