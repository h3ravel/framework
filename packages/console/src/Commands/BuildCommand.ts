import { Logger, TaskManager } from '@h3ravel/shared'

import { ConsoleCommand } from '@h3ravel/core'
import { execa } from 'execa'
import preferredPM from 'preferred-pm'

export class BuildCommand extends ConsoleCommand {

    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected signature: string = `build:
        {--m|minify : Minify your bundle output}
        {--d|dev : Build for dev but don't watch for changes}
    `

    /**
     * The console command description.
     *
     * @var string
     */
    protected description: string = 'Build the app for production'

    public async handle () {
        try {
            await this.fire()
        } catch (e) {
            Logger.error(e as any)
        }
    }

    protected async fire () {
        const outDir = this.option('dev') ? '.h3ravel/serve' : env('DIST_DIR', 'dist')
        const minify = this.option('minify')
        const verbosity = this.getVerbosity()
        const debug = verbosity > 0

        this.newLine()
        await BuildCommand.build({ outDir, minify, verbosity, debug, mute: false })
        this.newLine()
    }

    /**
     * build
     */
    public static async build ({ debug, minify, mute, verbosity, outDir } = {
        mute: false,
        debug: false,
        minify: false,
        verbosity: 0,
        outDir: 'dist'
    }) {

        const pm = (await preferredPM(base_path()))?.name ?? 'pnpm'

        const LOG_LEVELS = [
            'silent',
            'info',
            'warn',
            'error',
        ]

        const ENV_VARS = {
            EXTENDED_DEBUG: debug ? 'true' : 'false',
            CLI_BUILD: 'true',
            NODE_ENV: 'production',
            DIST_DIR: outDir,
            DIST_MINIFY: minify,
            LOG_LEVEL: LOG_LEVELS[verbosity]
        }

        const silent = ENV_VARS.LOG_LEVEL === 'silent' ? '--silent' : null

        if (mute) {
            return await execa(
                pm,
                ['tsdown', silent, '--config-loader', 'unconfig', '-c', 'tsdown.default.config.ts'].filter(e => e !== null),
                { stdout: 'inherit', stderr: 'inherit', cwd: base_path(), env: Object.assign({}, process.env, ENV_VARS) }
            )
        }

        const type = outDir === 'dist' ? 'Production' : 'Development'

        return await TaskManager.advancedTaskRunner(
            [[`Creating ${type} Bundle`, 'STARTED'], [`${type} Bundle Created`, 'COMPLETED']],
            async () => {
                await execa(
                    pm,
                    ['tsdown', silent, '--config-loader', 'unconfig', '-c', 'tsdown.default.config.ts'].filter(e => e !== null),
                    { stdout: 'inherit', stderr: 'inherit', cwd: base_path(), env: Object.assign({}, process.env, ENV_VARS) }
                )
            }
        )
    }
}
