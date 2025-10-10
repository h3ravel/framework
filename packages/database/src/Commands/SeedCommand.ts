import { FileSystem, Logger } from '@h3ravel/shared'

import { ConsoleCommand } from '@h3ravel/core'
import { DB } from '..'
import type { QueryBuilder } from '@h3ravel/arquebus'
import { Str } from '@h3ravel/support'
import npath from 'node:path'

export class SeedCommand extends ConsoleCommand {
    /**
     * The current query builder instance
     */
    public queryBuilder!: QueryBuilder

    /**
     * The current database connection name
     */
    private connection!: string

    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected signature: string = `db:seed
        {--class=DatabaseSeeder : The file name of the root seeder}
        {--d|database? : The database connection to use}
        {--force : Force the operation to run when in production}
    `
    /**
     * The console command description.
     *
     * @var string
     */
    protected description: string = 'Seed the database with records.'

    /**
     * Execute the console command.
     */
    public async handle () {
        const file = this.option('class')
        const force = this.option('force')
        const database = this.option('database')

        this.newLine()

        if (env('APP_ENV') === 'production' && !force) {
            this.error('INFO: Unable to run seeders, your app is currently in production.')
        }

        this.connection = database ?? config('database.default')
        this.queryBuilder = DB.instance(this.connection)

        if (!this.connection) {
            this.error('ERROR: Unknown database connection.')
        }

        let path = npath.join(process.cwd(), file)

        const [f1, f2] = [
            FileSystem.resolveFileUp(Str.snake(file), ['js', 'ts'], database_path('seeders')),
            FileSystem.resolveFileUp(Str.studly(file), ['js', 'ts'], database_path('seeders')),
        ]

        if (!f1 && !f2) {
            /**
             * Try to find the path assuming it's relative to cwd
             */
            if (!await FileSystem.fileExists(path)) {
                path = database_path(npath.join('seeders', file))
            }

            /**
             * Now try to find the path knowing it's relative to database_path
             */
            if (!await FileSystem.fileExists(path)) {
                this.error(`ERROR: Seeder ${Logger.log(`[${file}]`, 'bold', false)} not found.`)
            }
        } else {
            path = String(f1 ?? f2)
        }

        const { default: seeder } = (await import(path))

        if (seeder) {
            this.info('INFO: Seeding database.')
            this.newLine()

            await new seeder(this.app, this).run(this.queryBuilder)
        }
    }
}
