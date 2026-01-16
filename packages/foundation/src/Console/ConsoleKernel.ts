import { BootProviders, ExceptionHandler, RegisterFacades } from '..'
import { CKernel, CallableConstructor, ConcreteConstructor, IApplication, IBootstraper } from '@h3ravel/contracts'
import { Command, Kernel } from '@h3ravel/musket'
import { existsSync, statSync } from 'node:fs'

import { BuildCommand } from './Commands/BuildCommand'
import { ContainerResolver } from '@h3ravel/core'
import { DateTime } from '@h3ravel/support'
import { Injectable } from '..'
import { KeyGenerateCommand } from './Commands/KeyGenerateCommand'
import { MakeCommand } from './Commands/MakeCommand'
import { PostinstallCommand } from './Commands/PostinstallCommand'
import { Terminating } from '../Core/Events/Terminating'
import { altLogo } from './logo'
import { createRequire } from 'module'
import tsDownConfig from './TsdownConfig'

/**
 * ConsoleKernel class handles musket execution and transformations.
 * It acts as the core pipeline for console inputs.
*/
@Injectable()
export class ConsoleKernel extends CKernel {
    protected DIST_DIR: string

    /**
     * The bootstrap classes for the application.
     */
    #bootstrappers: ConcreteConstructor<IBootstraper>[] = [
        RegisterFacades,
        BootProviders
    ]

    /**
     * The current Musket console instance
     */
    protected commands: typeof Command[] = []
    /**
     * The current Musket console instance
     */
    protected console?: Kernel<IApplication>

    /**
     * When the current command started.
     */
    protected commandStartedAt?: DateTime

    /**
     * Indicates if the Closure commands have been loaded.
     */
    protected commandsLoaded = false

    /**
     * The paths where Musket commands should be automatically discovered.
     */
    protected commandPaths = new Set<string>()

    /**
     * The paths where Musket command routes should be automatically discovered.
     */
    protected commandRoutePaths = new Set<string>()

    protected commandLifecycleDurationHandlers: {
        'threshold': number,
        'handler': CallableConstructor,
    }[] = []

    /**
     * Create a new Console kernel instance.
     *
     * @param app The current application instance
     */
    constructor(
        protected app: IApplication,
    ) {
        super()
        globalThis.env ??= ((key: string, def: string) => Reflect.get(process.env, key) ?? def) as never
        this.DIST_DIR = `/${env('DIST_DIR', '.h3ravel/serve')}/`.replaceAll('//', '')
    }

    /**
     * Get the bootstrap classes for the application.
     *
     * @return array
     */
    protected bootstrappers () {
        return this.#bootstrappers
    }

    /**
     * Report the exception to the exception handler.
     * @param  e
     */
    protected reportException (e: Error) {
        this.app.make(ExceptionHandler).report(e)
    }

    /**
     * Render the given exception.
     *
     * @param  e
     */
    protected renderException (e: Error) {
        this.app.make(ExceptionHandler).renderForConsole(e)
    }

    /**
     * Run the console application.
     */
    async handle () {
        this.commandStartedAt = DateTime.now()
        await this.bootstrap()

        try {
            const status = await this.getConsole().run(true);

            ['SIGINT', 'SIGTERM', 'SIGTSTP'].forEach(sig => process.on(sig, () => {
                process.exit(0)
            }))

            return status
        } catch (e: any) {
            this.reportException(e)
            this.renderException(e)

            return 1
        }
    }

    /**
     * Register a given command.
     *
     * @param  command
     */
    registerCommand (command: typeof Command | typeof Command[]) {
        this.getConsole().registerCommands(Array.isArray(command) ? command : [command])
    }

    /**
     * Get all the registered commands.
     */
    // @ts-expect-error TS2322 -- Ignore --
    async all (): Promise<{
        new(app: IApplication, kernel: Kernel<IApplication>): Command<IApplication>;
    }[]> {
        await this.bootstrap()

        return this.getConsole().getRegisteredCommands()
    }

    /**
     * Bootstrap the application for Musket commands.
     *
     * @return void
     */
    async bootstrap () {
        if (!this.app.hasBeenBootstrapped()) {
            await this.app.bootstrapWith(this.bootstrappers())
        }

        // this.app.loadDeferredProviders()

        if (!this.commandsLoaded) {
            this.registerCommands()

            if (this.shouldDiscoverCommands()) {
                this.discoverCommands()
            }

            this.commandsLoaded = true
        }
    }

    /**
     * Determine if the kernel should discover commands.
     */
    protected shouldDiscoverCommands () {
        return this.constructor === ConsoleKernel
    }

    /**
     * Register the commands for the application.
     */
    protected registerCommands () {
        //
    }

    /**
     * Discover the commands that should be automatically loaded.
     */
    protected discoverCommands () {
        const require = createRequire(import.meta.url)

        this.getConsole().registerDiscoveryPath(Array.from(this.commandPaths))

        for (let path of this.commandRoutePaths) {
            path = path.replace('/src/', this.DIST_DIR)
            if (existsSync(path)) {
                class RouteCommand extends Command<IApplication> {
                    handle = require(path).default
                }

                this.getConsole().registerCommands([RouteCommand])
            }
        }
    }

    /**
     * Set the paths that should have their Musket commands automatically discovered.
     *
     * @param  paths
     */
    addCommandPaths (paths: string[]) {
        paths.forEach(e => {
            e = e.replace('/src/', this.DIST_DIR)
            this.commandPaths.add(statSync(e, { throwIfNoEntry: false })?.isFile() ? e : e + '*.js')
        })
        return this
    }

    /**
     * Set the paths that should have their Artisan "routes" automatically discovered.
     *
     * @param  paths
     */
    addCommandRoutePaths (paths: string[]): this {
        paths.forEach(e => this.commandRoutePaths.add(e))

        return this
    }

    /**
     * Get the Musket application instance.
     */
    // @ts-expect-error TS2322 -- Ignore --
    getConsole (): Kernel<IApplication> {
        if (this.console == null) {
            const baseCommands = [BuildCommand, MakeCommand, PostinstallCommand, KeyGenerateCommand] as any[]

            this.console = new Kernel(this.app)
                .setCwd(process.cwd())
                .setConfig({
                    logo: altLogo,
                    resolver: new ContainerResolver(this.app).resolveMethodParams,
                    tsDownConfig,
                    baseCommands,
                    packages: [
                        { name: '@h3ravel/core', alias: 'H3ravel Framework' },
                        { name: '@h3ravel/musket', alias: 'Musket CLI' }
                    ],
                    name: 'musket',
                    hideMusketInfo: true,
                    // discoveryPaths is commented out so we can rely on the console kernel to provide it
                    // discoveryPaths: [app_path('Console/Commands/*.js').replace('/src/', this.DIST_DIR)],
                    exceptionHandler: (e) => {
                        this.reportException(e)
                        this.renderException(e)
                    }
                })
                .setPackages([
                    { name: '@h3ravel/core', alias: 'H3ravel Framework' },
                    { name: '@h3ravel/musket', alias: 'Musket CLI' }
                ])
                .registerCommands(this.commands)
                .bootstrap()
        }

        return this.console
    }

    /**
     * Terminate the app.
     *
     * @param request
     */
    public terminate (status: number): void {
        this.app.make('app.events').dispatch(new Terminating())

        // this.app.terminate();

        if (!this.commandStartedAt) return

        this.commandStartedAt?.tz(this.app.make('config').get('app.timezone') ?? 'UTC')

        /*
         * Handle duration thresholds
         */
        let end: DateTime

        for (const { threshold, handler } of Object.values(this.commandLifecycleDurationHandlers)) {
            end ??= new DateTime()

            if (this.commandStartedAt.diff(end, 'milliseconds') > threshold) {
                handler(this.commandStartedAt, status)
            }
        }

        this.commandStartedAt = undefined
    }
}