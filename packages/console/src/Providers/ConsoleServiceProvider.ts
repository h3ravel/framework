/// <reference path="../../../core/src/app.globals.d.ts" />

import { Kernel } from '@h3ravel/musket'
import { ServiceProvider } from '@h3ravel/core'
/**
 * Handles CLI commands and tooling.
 * 
 * Register DatabaseManager and QueryBuilder.
 * Set up ORM models and relationships.
 * Register migration and seeder commands.
 * 
 * Auto-Registered when in CLI mode
 */
export class ConsoleServiceProvider extends ServiceProvider {
    public static priority = 992

    /**
     * Indicate that this service provider only runs in console
     */
    public static runsInConsole = true
    public runsInConsole = true

    register () {
    }

    boot () {
        const DIST_DIR = `/${env('DIST_DIR', '.h3ravel/serve')}/`.replaceAll('//', '')

        Kernel.init(
            this.app,
            {
                packages: ['@h3ravel/core'],
                cliName: 'musket',
                discoveryPaths: [app_path('Console/Commands/*.js').replace('/src/', DIST_DIR)]
            }
        )

        process.on('SIGINT', () => {
            process.exit(0)
        })
        process.on('SIGTERM', () => {
            process.exit(0)
        })
    }
}
