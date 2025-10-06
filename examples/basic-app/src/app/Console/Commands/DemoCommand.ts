import { Command } from '@h3ravel/console'

export class DemoCommand extends Command {
    /**
     * The name and signature of the console command.
     */
    protected signature: string = 'demo:verbosity {--simulate : Only simulate the actions}'

    /**
     * The console command description.
     */
    protected description: string = 'Demonstrate CLI verbosity and interaction options'

    /**
     * Execute the console command.
     */
    public async handle (): Promise<void> {
        // const simulate = this.option('simulate', false)

        this.info('Starting demonstration...')
        this.debug('Debug: This message only shows with --verbose 3')

        // Show current verbosity settings
        this.line(`Current verbosity level: ${this.getVerbosity()}`)
        this.line(`Quiet mode: ${this.isQuiet()}`)
        this.line(`Silent mode: ${this.isSilent()}`)
        this.line(`Non-interactive mode: ${this.isNonInteractive()}`)

        this.newLine()

        // Demonstrate different output levels
        this.info('This is an info message (suppressed by --quiet)')
        this.success('This is a success message (suppressed by --quiet)')
        this.warn('This is a warning message (always shown except --silent)')
        this.debug('This is a debug message (only shown with --verbose 3)')

        this.newLine()

        // Demonstrate interaction
        // if (!simulate) {
        //     try {
        //         const name = await this.ask('What is your name?', 'Developer')
        //         this.success(`Hello, ${name}!`)

        //         const confirmed = await this.confirm('Do you want to continue?', true)
        //         if (confirmed) {
        //             const environment = await this.choice(
        //                 'Select environment:',
        //                 ['development', 'staging', 'production'],
        //                 'development'
        //             )
        //             this.info(`Selected environment: ${environment}`)
        //         } else {
        //             this.warn('Operation cancelled by user')
        //         }
        //     } catch (error) {
        //         this.error(`Interaction failed: ${error}`)
        //     }
        // } else {
        //     this.info('Simulation mode - skipping interactive prompts')
        // }

        // this.newLine()
        // this.success('Demonstration completed!')

        // // Show debug information about verbosity
        // if (this.getVerbosity() >= 2) {
        //     this.debug('Verbose mode detected - showing additional information')
        //     this.debug(`Process arguments: ${process.argv.slice(2).join(' ')}`)
        // }
    }
}
