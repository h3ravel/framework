import { Command } from "./Command";

export class MigrateCommand extends Command {

    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected signature: string = `migrate:
        {fresh : Drop all tables and re-run all migrations. | {--s|seed : Seed the database}}
        {install : Create the migration repository.}
        {refresh : Reset and re-run all migrations.}
        {reset : Rollback all database migrations.}
        {rollback : Rollback the last database migration.}
        {status : Show the status of each migration.}
        {publish : Publish any migration files from packages.}
        {--s|seed : Seed the database}
    `;
    /**
     * The console command description.
     *
     * @var string
     */
    protected description: string = 'Run migrations';

    /**
     * Execute the console command.
     */
    public async handle () {
    }
}
