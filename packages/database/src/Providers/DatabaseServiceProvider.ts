import { ServiceProvider } from '@h3ravel/core'

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

    register () {
        // Core bindings
    }
}
