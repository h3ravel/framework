import { Application, Injectable, ServiceProvider } from '@h3ravel/core'

import { arquebus } from '@h3ravel/arquebus';
import { arquebusConfig } from '../Configuration';

/**
 * Database connection, ORM, migrations.
 * 
 * Register DatabaseManager and QueryBuilder if required.
 * Set up ORM models and relationships.
 * Register migration and seeder commands.
 * 
 * Auto-Registered if @h3ravel/database is installed
 */
export class DatabaseServiceProvider extends ServiceProvider {
    public static priority = 994;

    @Injectable()
    register () {
        const config = this.app.make('config')

        const connection = Object.entries(arquebusConfig(config.get('database')))
            .find(([client]) => client === config.get('database.default'))
            ?.at(1)

        if (connection) {
            arquebus.addConnection(connection);
            arquebus.connection()
        }

    }
}
