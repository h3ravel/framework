import { CommandOption, ParsedCommand } from './Contracts/ICommand'
import { Option, program } from 'commander'

import { Application } from '@h3ravel/core'
import { Command } from './Commands/Command'
import { FireCommand } from './Commands/FireCommand'
import { Kernel } from './Kernel'
import { ListCommand } from './Commands/ListCommand'
import { Logger } from '@h3ravel/shared'
import { MakeCommand } from './Commands/MakeCommand'
import { MigrateCommand } from './Commands/MigrateCommand'
import { Signature } from './Signature'
import TsDownConfig from './TsdownConfig'
import { altLogo } from './logo'
import { build } from 'tsdown'
import { glob } from 'node:fs/promises'
import path from 'node:path'

/**
 * Musket is H3ravel's CLI tool
 */
export class Musket {
    private commands: ParsedCommand[] = []

    constructor(private app: Application, private kernel: Kernel) { }

    async build () {
        this.loadBaseCommands()
        await this.loadDiscoveredCommands()
        return this.initialize()
    }

    private loadBaseCommands () {
        const commands: Command[] = [
            new FireCommand(this.app, this.kernel),
            new MakeCommand(this.app, this.kernel),
            new MigrateCommand(this.app, this.kernel),
            new ListCommand(this.app, this.kernel),
        ]

        commands.forEach(e => this.addCommand(e))
    }

    private async loadDiscoveredCommands () {
        const commands: Command[] = [
            ...this.app.registeredCommands.map(cmd => new cmd(this.app, this.kernel))
        ]

        /**
         * Musket Commands auto registration
         */
        const providers_path = app_path('Console/Commands/*.js').replace('/src/', '/.h3ravel/serve/')

        /** Add the App Commands */
        for await (const cmd of glob(providers_path)) {
            const name = path.basename(cmd).replace('.js', '')
            try {
                const cmdClass = (await import(cmd))[name]
                commands.push(new cmdClass(this.app, this.kernel))
            } catch { /** */ }
        }

        commands.forEach(e => this.addCommand(e))
    }

    addCommand (command: Command) {
        this.commands.push(Signature.parseSignature(command.getSignature(), command))
    }

    private initialize () {
        /** Init the Musket Version */
        const cliVersion = Logger.parse([
            ['Musket CLI:', 'white'],
            [this.kernel.consolePackage.version, 'green']
        ], ' ', false)

        /** Init the App Version */
        const localVersion = Logger.parse([
            ['H3ravel Framework:', 'white'],
            [this.kernel.modulePackage.version, 'green']
        ], ' ', false)

        /** Init Commander */
        program
            .name('musket')
            .version(`${cliVersion}\n${localVersion}`)
            .addOption(new Option('--silent', 'Do not output any message').implies({ quiet: true }))
            .option('-q, --quiet', 'Do not output any message')
            .option('-n, --no-interaction', 'Do not ask any interactive question')
            .option('-v, --verbose <number>', 'Increase the verbosity of messages: 1 for normal output, 2 for more verbose output and 3 for debug')
            .description(altLogo)
            .action(async () => {
                const instance = new ListCommand(this.app, this.kernel)
                instance.setInput(program.opts(), program.args, program.registeredArguments, {}, program)
                instance.handle()
            })

        /** Create the init Command */
        program
            .command('init')
            .description('Initialize H3ravel.')
            .action(async () => {
                Logger.success('Initialized: H3ravel has been initialized!')
            })

        /** Loop through all the available commands */
        for (let i = 0; i < this.commands.length; i++) {
            const command = this.commands[i]
            const instance = command.commandClass

            if (command.isNamespaceCommand && command.subCommands) {
                /**
                 * Initialize the base command
                 */
                const cmd = command.isHidden
                    ? program
                    : program
                        .command(command.baseCommand)
                        .description(command.description ?? '')
                        .action(async () => {
                            instance.setInput(cmd.opts(), cmd.args, cmd.registeredArguments, command, program)
                            await instance.handle()
                        })

                /**
                 * Add options to the base command if it has any
                 */
                if ((command.options?.length ?? 0) > 0) {
                    command.options
                        ?.filter((v, i, a) => a.findIndex(t => t.name === v.name) === i)
                        .forEach(opt => {
                            this.makeOption(opt, cmd)
                        })
                }

                /**
                 * Initialize the sub commands
                 */
                command
                    .subCommands
                    .filter((v, i, a) => !v.shared && a.findIndex(t => t.name === v.name) === i)
                    .forEach(sub => {
                        const cmd = program
                            .command(`${command.baseCommand}:${sub.name}`)
                            .description(sub.description || '')
                            .action(async () => {
                                instance.setInput(cmd.opts(), cmd.args, cmd.registeredArguments, sub, program)
                                await instance.handle()
                            })

                        /**
                         * Add the shared arguments here
                         */
                        command.subCommands?.filter(e => e.shared).forEach(opt => {
                            this.makeOption(opt, cmd, false, sub)
                        })

                        /**
                         * Add the shared options here
                         */
                        command.options?.filter(e => e.shared).forEach(opt => {
                            this.makeOption(opt, cmd, false, sub)
                        })

                        /**
                         * Add options to the sub command if it has any
                         */
                        if (sub.nestedOptions) {
                            sub.nestedOptions
                                .filter((v, i, a) => a.findIndex(t => t.name === v.name) === i)
                                .forEach(opt => {
                                    this.makeOption(opt, cmd)
                                })
                        }
                    })
            } else {
                /**
                 * Initialize command with options
                 */
                const cmd = program
                    .command(command.baseCommand)
                    .description(command.description ?? '')

                command
                    ?.options
                    ?.filter((v, i, a) => a.findIndex(t => t.name === v.name) === i)
                    .forEach(opt => {
                        this.makeOption(opt, cmd, true)
                    })

                cmd.action(async () => {
                    instance.setInput(cmd.opts(), cmd.args, cmd.registeredArguments, command, program)
                    await instance.handle()
                })
            }
        }

        /** Rebuild the app on every command except fire so we wont need TS */
        program.hook('preAction', async (_, cmd) => {
            if (cmd.name() !== 'fire') {
                await build({
                    ...TsDownConfig,
                    watch: false,
                    plugins: []
                })
            }
        })

        return program
    }

    makeOption (opt: CommandOption, cmd: typeof program, parse?: boolean, parent?: any) {
        const description = opt.description?.replace(/\[(\w+)\]/g, (_, k) => parent?.[k] ?? `[${k}]`) ?? ''
        const type = opt.name.replaceAll('-', '')

        if (opt.isFlag) {
            if (parse) {
                const flags = opt.flags
                    ?.map(f => (f.length === 1 ? `-${f}` : `--${f}`)).join(', ')!
                    .replaceAll('----', '--')
                    .replaceAll('---', '-')

                cmd.option(flags || '', description!, String(opt.defaultValue) || undefined)
            } else {
                cmd.option(
                    opt.flags?.join(', ') + (opt.required ? ` <${type}>` : ''),
                    description!,
                    opt.defaultValue as any
                )
            }
        } else {
            cmd.argument(
                opt.required ? `<${opt.name}>` : `[${opt.name}]`,
                description,
                opt.defaultValue
            )
        }
    }

    static async parse (kernel: Kernel) {
        return (await new Musket(kernel.app, kernel).build()).parseAsync()
    }
}
