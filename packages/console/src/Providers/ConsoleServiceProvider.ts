/// <reference path="../../../core/src/app.globals.d.ts" />

import { ContainerResolver, ServiceProvider } from '@h3ravel/core'

import { Kernel } from '@h3ravel/musket'
import { altLogo } from '../logo'
import tsDownConfig from '../TsdownConfig'

/**
 * Handles CLI commands and tooling.
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
                logo: altLogo,
                resolver: new ContainerResolver(this.app).resolveMethodParams,
                tsDownConfig,
                packages: [
                    { name: '@h3ravel/core', alias: 'H3ravel Framework' },
                    { name: '@h3ravel/musket', alias: 'Musket CLI' }
                ],
                cliName: 'musket',
                hideMusketInfo: true,
                discoveryPaths: [app_path('Console/Commands/*.js').replace('/src/', DIST_DIR)],
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
