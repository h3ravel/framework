import { Command } from './Command'
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
        {--d|debug : Show extra debug info, like registered service providers and more}
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
        const outDir = '.h3ravel/serve'

        const pm = (await preferredPM(base_path()))?.name ?? 'pnpm'
        const port = this.option('port')
        const host = this.option('host')
        const tries = this.option('tries')
        const debug = this.option('debug')

        const ENV_VARS = {
            EXTENDED_DEBUG: debug ? 'true' : 'false',
            CLI_BUILD: 'false',
            NODE_ENV: 'development',
            SRC_PATH: outDir,
            HOSTNAME: host,
            RETRIES: tries,
            PORT: port,
        }

        await execa(
            pm,
            ['tsdown', '--silent', '--config-loader', 'unconfig', '-c', 'tsdown.default.config.ts'],
            { stdout: 'inherit', stderr: 'inherit', cwd: base_path(), env: Object.assign({}, process.env, ENV_VARS) }
        )
    }
}
