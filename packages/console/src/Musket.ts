import { CommandOption, ParsedCommand } from "./Contracts/ICommand";

import { Application } from "@h3ravel/core";
import { Command } from "./Commands/Command";
import { Kernel } from "./Kernel";
import { MakeCommand } from "./Commands/MakeCommand";
import { MigrateCommand } from "./Commands/MigrateCommand";
import { ServeCommand } from "./Commands/ServeCommand";
import { Signature } from "./Signature";
import { Utils } from "./Utils";
import chalk from "chalk";
import { program } from "commander";

/**
 * Musket is H3ravel's CLI tool
 */
export class Musket {
    private output = Utils.output()
    private commands: ParsedCommand[] = []

    constructor(private app: Application, private kernel: Kernel) { }

    async build () {
        this.loadBaseCommands()
        await this.loadDiscoveredCommands()
        return this.initialize()
    }

    private loadBaseCommands () {
        const commands: Command[] = [
            new ServeCommand(this.app, this.kernel),
            new MakeCommand(this.app, this.kernel),
            new MigrateCommand(this.app, this.kernel),
        ]

        commands.forEach(e => this.addCommand(e))
    }

    private async loadDiscoveredCommands () {
        const commands: Command[] = [
        ]

        commands.forEach(e => this.addCommand(e))
    }

    addCommand (command: Command) {
        this.commands.push(Signature.parseSignature(command.getSignature(), command))
    }

    private initialize () {
        const cliVersion = [
            'H3ravel Version:',
            chalk.green(this.kernel.consolePackage.version),
        ].join(' ')

        const localVersion = [
            'Musket Version:',
            chalk.green(this.kernel.modulePackage.version || 'None'),
        ].join(' ')

        program
            .name('musket')
            .version(`${cliVersion}\n${localVersion}`)

        program
            .command('init')
            .description('Initialize H3ravel.')
            .action(async () => {
                this.output.success(`Initialized: H3ravel has been initialized!`)
            })

        for (let i = 0; i < this.commands.length; i++) {
            const command = this.commands[i];
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
                            instance.setInput(cmd.opts(), cmd.args, cmd.registeredArguments, command)
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
                                instance.setInput(cmd.opts(), cmd.args, cmd.registeredArguments, sub)
                                await instance.handle()
                            })

                        /**
                         * Add the shared arguments here
                         */
                        command.subCommands?.filter(e => e.shared).forEach(opt => {
                            this.makeOption(opt, cmd, false, sub)
                        });

                        /**
                         * Add the shared options here
                         */
                        command.options?.filter(e => e.shared).forEach(opt => {
                            this.makeOption(opt, cmd, false, sub)
                        });

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
                    });
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
                    });

                cmd.action(async () => {
                    instance.setInput(cmd.opts(), cmd.args, cmd.registeredArguments, command)
                    await instance.handle()
                });
            }
        }

        return program

    }

    makeOption (opt: CommandOption, cmd: typeof program, parse?: boolean, parent?: any) {
        const description = opt.description?.replace(/\[(\w+)\]/g, (_, k) => parent?.[k] ?? `[${k}]`) ?? ''
        const type = opt.name.replaceAll('-', '')

        if (opt.isFlag) {
            if (parse) {
                const flags = opt.flags?.map(f => (f.length === 1 ? `-${f}` : `--${f}`)).join(', ')!;
                cmd.option(flags || '', description!, String(opt.defaultValue) || undefined);
            } else {
                cmd.option(
                    opt.flags?.join(', ')! + (opt.required ? ` <${type}>` : ''),
                    description!,
                    opt.defaultValue as any
                );
            }
        } else {
            cmd.argument(
                opt.required ? `<${opt.name}>` : `[${opt.name}]`,
                description,
                opt.defaultValue
            );
        }
    }

    static async parse (kernel: Kernel) {
        return (await new Musket(kernel.app, kernel).build()).parseAsync()
    }
}
