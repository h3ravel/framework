import { mkdir, writeFile } from 'node:fs/promises'

import { Command } from '@h3ravel/musket'
import { FileSystem } from '@h3ravel/shared'
import { KeyGenerateCommand } from './KeyGenerateCommand'

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
        this.genEncryptionKey()
        this.createSqliteDB()
    }

    /**
     * Create sqlite database if none exist
     * 
     * @returns 
     */
    private async genEncryptionKey () {
        new KeyGenerateCommand(this.app, this.kernel)
            .setProgram(this.program)
            .setOption('force', true)
            .setOption('silent', true)
            .setOption('quiet', true)
            .setInput({ force: true, silent: true, quiet: true }, [], [], {}, this.program)
            .handle()
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
