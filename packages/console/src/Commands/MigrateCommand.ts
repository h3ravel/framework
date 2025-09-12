import { Command } from "./Command";
// import nodepath from "node:path";
import { Migrate } from "@h3ravel/arquebus/migrations";
import { arquebus } from "@h3ravel/arquebus";

export class MigrateCommand extends Command {

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
        this.kernel.output.success(`Running migrations are not yet supported.`)
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
        this.kernel.output.success(`Create the migration repository.`)
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
        this.kernel.output.success(`Rolling back the last migration is not yet supported.`)
    }

    /**
     * Show the status of each migration.
     */
    protected async migrateStatus () {
        const path = app_path()

        // console.log(arquebus.fire())
        // const migrations = await new Migrate(path, undefined, (msg, sts) => {
        //     if (sts) this.kernel.output[sts](msg)
        // }).status({ skipConnection: true }, this.options(), true)
        // console.log(migrations)

        this.kernel.output.success(`Show the status of each migration.`)
    }

    /**
     * Publish any migration files from installed packages.
     */
    protected async migratePublish () {
        this.kernel.output.success(`Publish any migration files from installed packages.`)
    }
}
