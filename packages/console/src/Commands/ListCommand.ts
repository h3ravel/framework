import { Command } from './Command'
import { Logger } from '@h3ravel/shared'
import { Option } from 'commander'
/* eslint-disable no-control-regex */
import { altLogo } from '../logo'

export class ListCommand extends Command {

    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected signature: string = 'list'

    /**
     * The console command description.
     *
     * @var string
     */
    protected description: string = 'List all available commands'

    public async handle () {
        const options = [
            {
                short: '-h',
                long: '--help',
                description: 'Display help for the given command. When no command is given display help for the list command'
            } as Option
        ]
            .concat(this.program.options)
            .map(e => {
                const desc = Logger.describe(Logger.log(
                    '  ' + [e.short, e.long].filter(e => !!e).join(', '), 'green', false
                ), e.description, 25, false)
                return desc.join('')
            })

        /** Get the program commands */
        const commands = this.program.commands.map(e => {
            const desc = Logger.describe(Logger.log('  ' + e.name(), 'green', false), e.description(), 25, false)
            return desc.join('')
        })

        const list = ListCommand.groupItems(commands)

        /** Ootput the app version */
        Logger.log([['H3ravel Framework', 'white'], [this.kernel.modulePackage.version, 'green']], ' ')

        console.log('')

        console.log(altLogo)

        console.log('')

        Logger.log('Usage:', 'yellow')
        Logger.log('  command [options] [arguments]', 'white')

        console.log('')

        /** Ootput the options */
        Logger.log('Options:', 'yellow')
        console.log(options.join('\n').trim())

        console.log('')

        /** Ootput the commands */
        Logger.log('Available Commands:', 'yellow')
        console.log(list.join('\n\n').trim())
    }

    /**
     * Group Commands based on thier names
     * 
     * @param commands 
     * @returns 
     */
    public static groupItems (commands: string[], fmtd = false) {
        const grouped = commands.reduce<Record<string, string[]>>((acc, cmd) => {
            /** strip colors before checking prefix */
            const clean = cmd.replace(/\x1b\[\d+m/g, '')
            const prefix = clean.includes(':') ? clean.split(':')[0].trim() : '__root__'
            acc[prefix] ??= []
            /** keep original with colors */
            acc[prefix].push(cmd)
            return acc
        }, {})

        return Object.entries(grouped).map(([group, cmds]) => {
            const label = group === '__root__' ? '' : group
            let out = [Logger.log(label, 'yellow', false), cmds.join('\n')].join('\n')
            if (fmtd) {
                out += '\n'
            }
            return out
        })
    }
}
