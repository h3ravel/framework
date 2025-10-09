import { FileSystem, Logger, Resolver } from '@h3ravel/shared'
import { Migrate, MigrationCreator } from '@h3ravel/arquebus/migrations'
import { TBaseConfig, arquebusConfig } from '..'

import { ConsoleCommand } from '@h3ravel/core'
import path from 'node:path'

export class MigrateCommand extends ConsoleCommand {
    /**
     * The current database connection
     */
    private connection!: TBaseConfig

    /** 
     * The base path for all database operations
     */
    private databasePath: string = database_path()

    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected signature: string = `migrate:
        {fresh : Drop all tables and re-run all migrations.}
        {install : Create the migration repository.}
        {refresh : Reset and re-run all migrations.}
        {reset : Rollback all database migrations.}
        {rollback : Rollback the last database migration.}
        {status : Show the status of each migration.}
        {publish : Publish any migration files from installed packages. | {package : The package to publish migrations from}}
        {^--s|seed : Seed the database}
        {^--c|connection=mysql : The database connection to use : [mysql, sqlite, mariadb, pgsql]}
    `
    /**
     * The console command description.
     *
     * @var string
     */
    protected description: string = 'Run all pending migrations.'

    /**
     * Execute the console command.
     */
    public async handle (this: any) {
        const command = (this.dictionary.name ?? this.dictionary.baseCommand) as never

        this.connection = Object.entries(arquebusConfig(config('database')))
            .find(([client]) => client === config('database.default'))
            ?.at(1)

        this.connection.migrations = {
            path: 'migrations',
            table: 'migrations',
        }

        const methods = {
            migrate: 'migrateRun',
            fresh: 'migrateFresh',
            install: 'migrateInstall',
            refresh: 'migrateRefresh',
            reset: 'migrateReset',
            rollback: 'migrateRollback',
            status: 'migrateStatus',
            publish: 'migratePublish',
        } as const

        await this[methods[command]]()
    }

    /**
     * Run all pending migrations.
     */
    protected async migrateRun () {
        try {
            await new Migrate(this.databasePath).run(this.connection, this.options(), true)
        } catch (e) {
            Logger.error('ERROR: ' + e)
        }
    }

    /**
     * Drop all tables and re-run all migrations.
     */
    protected async migrateFresh () {
        try {
            await new Migrate(this.databasePath).fresh(this.connection, this.options(), true)
        } catch (e) {
            Logger.error('ERROR: ' + e)
        }
    }

    /**
     * Create the migration repository.
     */
    protected async migrateInstall () {
        try {
            const migrate = new Migrate(this.databasePath)
            const { migrator } = await migrate.setupConnection(this.connection)
            await migrate.prepareDatabase(migrator)

            Logger.success('Migration repository installed.')
        } catch (e) {
            Logger.error('ERROR: ' + e)
        }
    }

    /**
     * Reset and re-run all migrations.
     */
    protected async migrateRefresh () {
        try {
            await new Migrate(this.databasePath).refresh(this.connection, this.options(), true)
        } catch (e) {
            Logger.error('ERROR: ' + e)
        }
    }

    /**
     * Rollback all database migrations.
     */
    protected async migrateReset () {
        try {
            await new Migrate(this.databasePath).reset(this.connection, this.options(), true)
        } catch (e) {
            Logger.error('ERROR: ' + e)
        }
    }

    /**
     * Rollback the last database migration.
     */
    protected async migrateRollback () {
        try {
            await new Migrate(this.databasePath).rollback(this.connection, this.options(), true)
        } catch (e) {
            Logger.error('ERROR: ' + e)
        }
    }

    /**
     * Show the status of each migration.
     */
    protected async migrateStatus () {
        const migrations = await new Migrate(this.databasePath, undefined, (msg, sts) => {
            const hint = Logger.parse([
                [' Did you forget to run', 'white'],
                ['`musket migrate:install`?', 'grey']
            ], ' ', false)

            if (sts) Logger[sts](msg + hint, sts === 'error', true)
        }).status(this.connection, this.options(), true)

        try {
            if (migrations.length > 0) {
                Logger.twoColumnDetail('Migration name', 'Batch / Status')

                migrations.forEach(migration => {
                    const status = migration.ran
                        ? Logger.parse([[`[${migration.batch}]`, 'white'], ['Ran', 'green']], ' ', false)
                        : Logger.parse([['Pending', 'yellow']], '', false)
                    Logger.twoColumnDetail(migration.name, status)
                })
            }
            else {
                Logger.info('No migrations found')
            }
        } catch (e) {
            Logger.error(['ERROR: ' + e, 'Did you run musket migrate:install'])
        }
    }



    /**
     * Publish any migration files from installed packages.
     */
    protected async migratePublish () {
        const name = this.argument('package')

        try {
            /** Find the requested package */
            const packagePath = FileSystem.findModulePkg(name) ?? null
            if (!packagePath) throw new Error('Package not found')

            /** Get the package,json and instanciate the migration creator */
            const pkgJson = (await import(path.join(packagePath, 'package.json')))
            const creator = new MigrationCreator(path.join(packagePath, pkgJson.migrations ?? 'migrations'))

            const info = Logger.parse([
                [' Publishing migrations from', 'white'],
                [`${pkgJson.name}@${pkgJson.version}`, ['italic', 'gray']]
            ], ' ', false)

            Logger.info(`INFO: ${info}`)

            try {
                /** Publish any existing migrations */
                await creator.publish(this.databasePath, (fileName) => {
                    Logger.twoColumnDetail(fileName, Logger.parse([['PUBLISHED', 'green']], '', false))
                })
            } catch {
                Logger.error([`ERROR: ${name} has no publishable migrations.`])
            }
        } catch (e) {
            const hint = Logger.parse([
                [' Did you forget to run', 'white'],
                [`\`${await Resolver.getPakageInstallCommand(name)}\``, 'grey']
            ], ' ', false)

            const error = Logger.parse([
                ['Package `', 'white'],
                [name, 'grey'],
                ['` not found', 'white']
            ], '', false)

            Logger.error(['ERROR: ' + error, hint + '?', String(e)])
        }
    }
}
