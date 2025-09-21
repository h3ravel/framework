import { TBaseConfig, arquebusConfig } from "@h3ravel/database";

import { Command } from "./Command";
// import nodepath from "node:path";
import { Migrate } from "@h3ravel/arquebus/migrations";
import chalk from "chalk";

export class MigrateCommand extends Command {
    /**
     * The current database connection
     */
    private connection!: TBaseConfig;

    /** 
     * The base path for all database operations
     */
    private databasePath: string = database_path();

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
        {publish : Publish any migration files from installed packages.}
        {^--s|seed : Seed the database}
        {^--c|connection=mysql : The database connection to use}
    `;
    /**
     * The console command description.
     *
     * @var string
     */
    protected description: string = 'Run all pending migrations.';

    /**
     * Execute the console command.
     */
    public async handle () {
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
        } as const;

        await (this as any)?.[methods[command]]()
    }

    /**
     * Run all pending migrations.
     */
    protected async migrateRun () {
        try {
            await new Migrate(this.databasePath).run(this.connection, this.options(), true)

            this.kernel.output.success(`Migration Complete.`)
        } catch (e) {
            this.kernel.output.error('ERROR: ' + e)
        }
    }

    /**
     * Drop all tables and re-run all migrations.
     */
    protected async migrateFresh () {
        this.kernel.output.success(`Drop all tables and re-run all migrations.`)
    }

    /**
     * Create the migration repository.
     */
    protected async migrateInstall () {
        try {
            const migrate = new Migrate(this.databasePath)
            const { migrator } = await migrate.setupConnection(this.connection)
            await migrate.prepareDatabase(migrator)

            this.kernel.output.success(`Migration repository installed.`)
        } catch (e) {
            this.kernel.output.error('ERROR: ' + e)
        }
    }

    /**
     * Reset and re-run all migrations.
     */
    protected async migrateRefresh () {
        this.kernel.output.success(`Resetting and re-running migrations is not yet supported.`)
    }

    /**
     * Rollback all database migrations.
     */
    protected async migrateReset () {
        this.kernel.output.success(`Rolling back all migration is not yet supported.`)
    }

    /**
     * Rollback the last database migration.
     */
    protected async migrateRollback () {
        try {
            await new Migrate(this.databasePath).rollback(this.connection, this.options(), true)

            this.kernel.output.success(`Rollback Complete.`)
        } catch (e) {
            this.kernel.output.error('ERROR: ' + e)
        }
    }

    /**
     * Show the status of each migration.
     */
    protected async migrateStatus () {
        const migrations = await new Migrate(this.databasePath, undefined, (msg, sts) => {
            const hint = this.kernel.output.parse([
                [' Did you forget to run', 'white'],
                ['`musket migrate:install`?', 'grey']
            ], ' ', false)

            if (sts) this.kernel.output[sts](msg + hint, sts === 'error', true)
        }).status(this.connection, this.options(), true)

        try {
            if (migrations.length > 0) {
                this.kernel.output.twoColumnLog('Migration name', 'Batch / Status')

                migrations.forEach(migration => {
                    const status = migration.ran
                        ? `[${migration.batch}] ${chalk.green('Ran')}`
                        : chalk.yellow('Pending')
                    this.kernel.output.twoColumnLog(migration.name, status)
                })
            }
            else {
                this.kernel.output.info('No migrations found')
            }
        } catch (e) {
            this.kernel.output.error(['ERROR: ' + e, 'Did you run musket migrate:install'])
        }
    }

    /**
     * Publish any migration files from installed packages.
     */
    protected async migratePublish () {
        this.kernel.output.success(`Publish any migration files from installed packages.`)
    }
}
