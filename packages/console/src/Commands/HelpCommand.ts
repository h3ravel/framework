import { Command } from './Command'
import { Logger } from '@h3ravel/shared'

export class HelpCommand extends Command {

    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected signature: string = `help
        {command_name=help : The command name}
        {--format=txt : The output format}
    `

    /**
     * The console command description.
     *
     * @var string
     */
    protected description: string = 'Display help for a command'

    public async handle () {
        const cmd = this.argument('command_name')

        if (!cmd) {
            this.program.outputHelp()
            return
        }

        const target = this.program.commands.find(c => c.name() === cmd)

        if (!target) {
            this.error(`ERROR: Unknown command: ${Logger.log(cmd, ['italic', 'grey'], false)}.`)
            process.exit(1)
        }

        target.outputHelp()
    }
}
