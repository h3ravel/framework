import { mkdir, writeFile } from 'node:fs/promises'

import { Command } from './Command'
import { FileSystem } from '@h3ravel/shared'

export class PostinstallCommand extends Command {

    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected signature: string = 'postinstall'

    /**
     * The console command description.
     *
     * @var string
     */
    protected description: string = 'Default post installation command'

    public async handle () {
        this.createSqliteDB()
    }

    /**
     * Create sqlite database if none exist
     * 
     * @returns 
     */
    private async createSqliteDB () {
        if (config('database.default') !== 'sqlite') return

        if (!await FileSystem.fileExists(database_path())) {
            await mkdir(database_path(), { recursive: true })
        }

        if (!await FileSystem.fileExists(database_path('db.sqlite'))) {
            await writeFile(database_path('db.sqlite'), '')
        }
    }
}
