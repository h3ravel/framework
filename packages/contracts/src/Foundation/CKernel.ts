import type { Command, Kernel as ConsoleKernel } from '@h3ravel/musket'

import { IApplication } from '../Core/IApplication'

export abstract class CKernel {
    /**
     * Run the console application.
     */
    abstract handle (): Promise<number>;

    /**
     * Register a given command.
     *
     * @param  command
     */
    abstract registerCommand (command: any): void;

    /**
     * Get all the registered commands.
     */
    abstract all (): Promise<{
        new(app: IApplication, kernel: ConsoleKernel<IApplication>): Command<IApplication>;
    }[]>;

    /**
     * Bootstrap the application for Musket commands.
     *
     * @return void
     */
    abstract bootstrap (): Promise<void>;

    /**
     * Set the paths that should have their Musket commands automatically discovered.
     *
     * @param  paths
     */
    abstract addCommandPaths (paths: string[]): this;

    /**
     * Set the paths that should have their Artisan "routes" automatically discovered.
     *
     * @param  paths
     */
    abstract addCommandRoutePaths (paths: string[]): this

    /**
     * Get the Musket application instance.
     */
    abstract getConsole (): ConsoleKernel<IApplication>;

    /**
     * Terminate the app.
     *
     * @param request
     */
    abstract terminate (status: number): void
}