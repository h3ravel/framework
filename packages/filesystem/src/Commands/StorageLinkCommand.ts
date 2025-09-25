import { ConsoleCommand } from '@h3ravel/core'

export class StorageLinkCommand extends ConsoleCommand {

    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected signature: string = `storage:link
        {--r|relative : Create the symbolic link using relative paths}
        {--force : Recreate existing symbolic links}
    `
    /**
     * The console command description.
     *
     * @var string
     */
    protected description: string = 'Create the symbolic links configured for the application.'

    /**
     * Execute the console command.
     */
    public async handle () {
        console.log(this.options())
    }
}
