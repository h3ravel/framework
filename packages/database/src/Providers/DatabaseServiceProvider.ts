import { MakeCommand } from '../Commands/MakeCommand'
import { MigrateCommand } from '../Commands/MigrateCommand'
import { SeedCommand } from '../Commands/SeedCommand'
import { ServiceProvider } from '@h3ravel/core'
import { arquebus } from '@h3ravel/arquebus'
import { arquebusConfig } from '../Configuration'

/**
 * Database connection, ORM, migrations.
 * 
 * Register DatabaseManager and QueryBuilder if required.
 * Set up ORM models and relationships.
 * Register migration and seeder commands.
 * 
 */
export class DatabaseServiceProvider extends ServiceProvider {
    public static priority = 994

    register () {
        const config = this.app.make('config')

        const connection = Object.entries(arquebusConfig(config.get('database')))
            .find(([client]) => client === config.get('database.default'))
            ?.at(1)

        if (connection) {
            arquebus.addConnection(connection)
        }

        this.app.singleton('db', () => arquebus.fire())

        /** Register Musket Commands */
        this.registerCommands([MigrateCommand, MakeCommand, SeedCommand])
    }
}
