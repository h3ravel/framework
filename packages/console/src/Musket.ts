
import { CommandOption, ParsedCommand } from './Contracts/ICommand'
import { Argument, Option, program, type Command as Commander } from 'commander'

import { Application, ContainerResolver } from '@h3ravel/core'
import { Command } from './Commands/Command'
import { Kernel } from './Kernel'
import { ListCommand } from './Commands/ListCommand'
import { Logger } from '@h3ravel/shared'
import { MakeCommand } from './Commands/MakeCommand'
import { Signature } from './Signature'
import TsDownConfig from './TsdownConfig'
import { altLogo } from './logo'
import { build } from 'tsdown'
import { glob } from 'node:fs/promises'
import path from 'node:path'
import { PostinstallCommand } from './Commands/PostinstallCommand'
import { BuildCommand } from './Commands/BuildCommand'
import { HelpCommand } from './Commands/HelpCommand'


export class Musket {
    private commands: ParsedCommand[] = []

    constructor(private app: Application, private kernel: Kernel) { }

    async build () {
        this.loadBaseCommands()
        await this.loadDiscoveredCommands()
        return await this.initialize()
    }

    private loadBaseCommands () {
        const commands: Command[] = [
            new HelpCommand(this.app, this.kernel),
            new MakeCommand(this.app, this.kernel),
            new ListCommand(this.app, this.kernel),
            new PostinstallCommand(this.app, this.kernel),
            new BuildCommand(this.app, this.kernel),
        ]

        commands.forEach(e => this.addCommand(e))
    }

    private async loadDiscoveredCommands () {
        const DIST_DIR = `/${env('DIST_DIR', '.h3ravel/serve')}/`.replaceAll('//', '')
        const commands: Command[] = [
            ...this.app.registeredCommands.map(cmd => new cmd(this.app, this.kernel))
        ]

        /**
         * Musket Commands auto registration
         */
        const providers_path = app_path('Console/Commands/*.js').replace('/src/', DIST_DIR)

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

    private async initialize () {
        // Build the app if the user is calling for help to ensure we get the latest data
        if (process.argv.includes('--help') || process.argv.includes('-h')) {
            await this.rebuild('help')
            Object.keys(require.cache).forEach(key => delete require.cache[key])
        }

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

        const additional = {
            quiet: ['-q, --quiet', 'Do not output any message except errors and warnings'],
            silent: ['--silent', 'Do not output any message'],
            verbose: ['-v, --verbose <number>', 'Increase the verbosity of messages: 1 for normal output, 2 for more verbose output and 3 for debug'],
            noInteraction: ['-n, --no-interaction', 'Do not ask any interactive question'],
        }

        /** 
         * Init Commander
         */
        program
            .name('musket')
            .version(`${cliVersion}\n${localVersion}`)
            .description(altLogo)
            .configureHelp({ showGlobalOptions: true })
            .addOption(new Option(additional.quiet[0], additional.quiet[1]))
            .addOption(new Option(additional.silent[0], additional.silent[1]).implies({ quiet: true }))
            .addOption(new Option(additional.verbose[0], additional.verbose[1]).choices(['1', '2', '3']))
            .addOption(new Option(additional.noInteraction[0], additional.noInteraction[1]))
            .action(async () => {
                const instance = new ListCommand(this.app, this.kernel)
                instance.setInput(program.opts(), program.args, program.registeredArguments, {}, program)
                await this.handle(instance)
            })

        /**
         * Format the help command display
         */
        program.configureHelp({
            styleTitle: (str) => Logger.log(str, 'yellow', false),
            styleOptionTerm: (str) => Logger.log(str, 'green', false),
            styleArgumentTerm: (str) => Logger.log(str, 'green', false),
            styleSubcommandTerm: (str) => Logger.log(str, 'green', false),
            formatItemList (heading, items) {
                if (items.length < 1) {
                    return []
                }

                if (!heading.includes('Commands:')) {
                    return items
                }

                const c = (str: string) => str.replace(/[^A-Za-z0-9-,]/g, '').replace('32m', '')

                let flags = items.filter(e => c(e).startsWith('--') || c(e).includes(',--'))

                if (flags.length > 0) {
                    flags = [Logger.log('\n' + heading + '\n', 'yellow', false)].concat(flags)
                }

                const list = items.filter(e => !c(e).startsWith('--') && !c(e).includes(',--'))

                if (list.length < 1) {
                    return flags
                }

                const _heading = c(heading).includes('Arguments') ? heading : 'Available Commands:'

                return flags.concat(Logger.log(`\n${_heading}`, 'yellow', false), ListCommand.groupItems(list, true))
            },
            showGlobalOptions: true
        })


        /** 
         * Create the init Command
         */
        program
            .command('init')
            .description('Initialize H3ravel.')
            .action(async () => {
                Logger.success('Initialized: H3ravel has been initialized!')
            })

        /** 
         * Loop through all the available commands
         */
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
                            await this.handle(instance)
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
                                await this.handle(instance)
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
                    await this.handle(instance)
                })
            }
        }

        /** Rebuild the app on every command except fire so we wont need TS */
        program.hook('preAction', async (_, cmd) => {
            this.rebuild(cmd.name())
        })

        return program
    }

    async rebuild (name: string) {
        if (name !== 'fire' && name !== 'build') {
            await build({
                ...TsDownConfig,
                watch: false,
                plugins: []
            })
        }
    }

    private makeOption (opt: CommandOption, cmd: Commander, parse?: boolean, parent?: any) {
        const description = opt.description?.replace(/\[(\w+)\]/g, (_, k) => parent?.[k] ?? `[${k}]`) ?? ''
        const type = opt.name.replaceAll('-', '')

        if (opt.isFlag) {
            if (parse) {
                let flags = opt.flags
                    ?.map(f => (f.length === 1 ? `-${f}` : `--${f.replace(/^-+/, '')}`))
                    .join(', ') ?? undefined

                if (opt.required && !opt.placeholder) {
                    flags += ` <${type}>`
                } else if (opt.placeholder) {
                    flags += ' ' + opt.placeholder
                }

                let optn = new Option(flags || '', description).default(opt.defaultValue)
                if (opt.choices && opt.choices.length) {
                    optn = optn.choices(opt.choices ?? [])
                }
                cmd.addOption(optn)
            } else {
                let flags = opt.flags?.join(', ') ?? ''

                if (opt.required && !opt.placeholder) {
                    flags += ` <${type}>`
                } else if (opt.placeholder) {
                    flags += ' ' + opt.placeholder
                }

                let optn = new Option(flags, description).default(opt.defaultValue)
                if (opt.choices && opt.choices.length) {
                    optn = optn.choices(opt.choices ?? [])
                }
                cmd.addOption(optn)
            }
        } else {
            let name = opt.placeholder
            if (!name) {
                name = opt.required ? `<${opt.name}>` : `[${opt.name}]`
            }

            let arg = new Argument(name, description)
            if (opt.choices && opt.choices.length) {
                arg = arg.choices(opt.choices ?? [])
            }
            if (opt.defaultValue) arg.default(opt.defaultValue)
            cmd.addArgument(arg)
        }
    }

    private async handle (cmd: Command) {
        //
        await new ContainerResolver(this.app).resolveMethodParams(cmd, 'handle')
    }

    static async parse (kernel: Kernel) {
        return (await new Musket(kernel.app, kernel).build())
            .exitOverride(() => {
                Logger.log('Unknown command or argument.', 'white')
                Logger.log([
                    ['Run', 'white'],
                    ['`musket --help`', ['grey', 'italic']],
                    ['to see available commands.', 'white']
                ], ' ')
            })
            .parseAsync(process.argv)
            .catch(e => e)
    }

}
