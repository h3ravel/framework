import { FileSystem, Logger } from '@h3ravel/shared'
import { rm, symlink, unlink } from 'fs/promises'

import { ConsoleCommand } from '@h3ravel/core'

export class StorageLinkCommand extends ConsoleCommand {

    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected signature: string = `#storage:
        {link : Create the symbolic links configured for the application. 
            | {--r|relative : Create the symbolic link using relative paths}
            | {--force : Recreate existing symbolic links}
        }
        {unlink : Delete existing symbolic links configured for the application.}
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
    public async handle (this: any) {
        console.log('')
        const command = (this.dictionary.baseCommand ?? this.dictionary.name)

        await this[command]()
    }

    /**
     * Create the symbolic links configured for the application.
     */
    public async link () {
        const links = config('filesystem.links')

        for (const key in links) {
            const force = this.option('force')
            const newPath = key
            const existingPath = links[key]

            if (!force && await FileSystem.fileExists(newPath)) {
                Logger.log([
                    [' ERROR ', 'bgRed'],
                    ['The', 'white'],
                    [`[${newPath.replace(process.cwd(), '')}]`, 'bold'],
                    ['link already exists.\n', 'white']
                ], ' ')
                continue
            } else if (force) {
                await rm(newPath, { recursive: true, force: true })
            }

            /**
             * Create the symlink
             */
            await symlink(existingPath, newPath)

            Logger.log([
                [' INFO ', 'bgBlue'],
                [' The ', 'white'],
                [`[${newPath.replace(process.cwd(), '')}] `, 'bold'],
                ['link has been connected to ', 'white'],
                [`[${existingPath.replace(process.cwd(), '')}]`, 'bold'],
                ['.\n', 'white']
            ], '')
        }
    }

    /**
     * Delete existing symbolic links configured for the application.
     */
    public async unlink () {
        const links = config('filesystem.links')

        for (const path in links) {
            if (await FileSystem.fileExists(path)) {
                /**
                 * Remove the symlink
                 */
                await unlink(path)

                Logger.log([
                    [' INFO ', 'bgBlue'],
                    [' The ', 'white'],
                    [`[${path.replace(process.cwd(), '')}] `, 'bold'],
                    ['link has been deleted', 'white'],
                    ['.\n', 'white']
                ], '')

            }
        }
    }
}
