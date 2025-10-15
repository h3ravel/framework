import { Command } from '@h3ravel/musket'
import { Logger } from '@h3ravel/shared'
import { execa } from 'execa'
import preferredPM from 'preferred-pm'

export class FireCommand extends Command {

    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected signature: string = `fire:
        {--a|host=localhost : The host address to serve the application on}
        {--p|port=3000 : The port to serve the application on}
        {--t|tries=10 : The max number of ports to attempt to serve from}
    `

    /**
     * The console command description.
     *
     * @var string
     */
    protected description: string = 'Fire up the developement server'

    public async handle () {
        try {
            await this.fire()
        } catch (e) {
            Logger.error(e as any)
        }
    }

    protected async fire () {
        const outDir = env('DIST_DIR', '.h3ravel/serve')

        const pm = (await preferredPM(base_path()))?.name ?? 'pnpm'
        const port = this.option('port')
        const host = this.option('host')
        const tries = this.option('tries')
        const debug = Number(this.option('verbose', 0)) > 0
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
            DIST_DIR: outDir,
            HOSTNAME: host,
            RETRIES: tries,
            PORT: port,
            LOG_LEVEL: LOG_LEVELS[Number(this.option('verbose', 0))],
        }

        const silent = ENV_VARS.LOG_LEVEL === 'silent' ? '--silent' : null

        await execa(
            pm,
            ['tsdown', silent, '--config-loader', 'unconfig', '-c', 'tsdown.default.config.ts'].filter(e => e !== null),
            { stdout: 'inherit', stderr: 'inherit', cwd: base_path(), env: Object.assign({}, process.env, ENV_VARS) }
        )
    }
}
