import { Command } from '@h3ravel/musket'
import { Logger } from '@h3ravel/shared'
import { execa } from 'execa'
import preferredPM from 'preferred-pm'

export class DevCommand extends Command {

    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected signature: string = `dev
        {--m|minify : Minify your bundle output}
    `

    /**
     * The console command description.
     *
     * @var string
     */
    protected description: string = 'Build the app for production'

    public async handle () {
        const minify = this.option('minify')
        const verbosity = this.getVerbosity()
        const debug = verbosity > 0

        try {
            this.newLine()
            await DevCommand.dev({ minify, verbosity, debug })
            this.newLine()
        } catch (e) {
            Logger.error(e as any)
        }
    }

    /**
     * Build output for developement
     * 
     * @param param0 
     * @returns 
     */
    public static async dev ({ debug, minify, verbosity } = {
        debug: false,
        minify: false,
        verbosity: 0
    }) {

        const pm = (await preferredPM(base_path()))?.name ?? 'pnpm'

        const LOG_LEVELS = [
            'silent',
            'silent',
            'info',
            'warn',
            'error',
        ]

        const ENV_VARS = {
            EXTENDED_DEBUG: debug ? 'true' : 'false',
            CLI_BUILD: 'false',
            NODE_ENV: 'development',
            DIST_DIR: '.h3ravel/serve',
            DIST_MINIFY: minify,
            LOG_LEVEL: LOG_LEVELS[verbosity]
        }

        const silent = ENV_VARS.LOG_LEVEL === 'silent' ? ['--log-level', 'silent'] : []

        return await execa(
            pm,
            ['tsdown', ...silent, '--config-loader', 'native', '-c', 'tsdown.default.config.ts'].filter(e => e !== null),
            { stdout: 'inherit', stderr: 'inherit', cwd: base_path(), env: Object.assign({}, process.env, ENV_VARS) }
        )
    }
}
