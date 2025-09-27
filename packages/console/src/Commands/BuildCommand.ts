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
        {--m|minify=false : Minify your bundle output}
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
        const outDir = env('DIST_DIR', 'dist')

        const pm = (await preferredPM(base_path()))?.name ?? 'pnpm'
        const minify = this.option('minify')
        const debug = Number(this.option('verbose', 0)) > 0
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
            LOG_LEVEL: LOG_LEVELS[Number(this.option('verbose', 0))]
        }

        const silent = ENV_VARS.LOG_LEVEL === 'silent' ? '--silent' : null

        Logger.log([['\n INFO ', 'bgBlue'], [' Creating Production Bundle', 'white']], '')
        console.log('')

        await TaskManager.taskRunner(Logger.log([[' SUCCESS ', 'bgGreen'], [' Production Bundle Created', 'white']], '', false), async () => {
            await execa(
                pm,
                ['tsdown', silent, '--config-loader', 'unconfig', '-c', 'tsdown.default.config.ts'].filter(e => e !== null),
                { stdout: 'inherit', stderr: 'inherit', cwd: base_path(), env: Object.assign({}, process.env, ENV_VARS) }
            )
            console.log('')
        })
    }
}
