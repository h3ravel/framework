import { Command } from '@h3ravel/console'

export class ExampleCommand extends Command {

    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected signature: string = `example
        {name : Name of the example.}
        {--d|debug : Show debug info}
    `

    /**
     * The console command description.
     *
     * @var string
     */
    protected description: string = 'An example command'

    public async handle () {
        const name = this.argument('name')
        const debug = this.option('debug')

        dd('name: ' + name, 'debug: ' + (debug !== 'undefined'))
    }
}
