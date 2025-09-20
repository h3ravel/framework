import { Command } from "./Command";
import { build } from 'tsdown'
import run from '@rollup/plugin-run';
import { spawn } from "node:child_process";

export class FireCommand extends Command {

    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected signature: string = `fire:
        {--host=localhost : The host address to serve the application on}
        {--port=3000 : The port to serve the application on}
        {--tries=10 : The max number of ports to attempt to serve from}
    `;

    /**
     * The console command description.
     *
     * @var string
     */
    protected description: string = 'Fire up the developement server';

    public async handle () {
        try {
            await this.fire()
        } catch (e) {
            this.kernel.output.error(e as any)
        }
    }

    protected async fire () {
        const outDir = '.h3ravel/serve'

        const db = base_path('src/database')
        const dist = base_path(outDir)
        const base = base_path('src/resources')
        const port = this.option('port')
        const host = this.option('host')
        const tries = this.option('tries')

        let child: ReturnType<typeof spawn> | null = null;
        const ENV_VARS = {
            NODE_ENV: 'development',
            SRC_PATH: outDir,
            HOSTNAME: host,
            RETRIES: tries,
            PORT: port,
        }

        await build({
            outDir: dist,
            entry: ['src/**/*.ts'],
            format: ['esm', 'cjs'],
            target: 'node22',
            sourcemap: true,
            clean: true,
            shims: true,
            watch: ['.env', '.env.*', base_path('.env'), base_path('src')],
            copy: ['public', 'src/resources', 'src/database'],
            // copy: [{ from: 'public', to: dist }, 'src/resources', 'src/database'],
            env: ENV_VARS,
            hooks (hooks) {
                hooks.hook('build:done', () => {
                })
            },
            dts: false,
            logLevel: 'silent',
            nodeProtocol: true,
            skipNodeModulesBundle: true,
            plugins: [
                run({
                    env: Object.assign({}, process.env, ENV_VARS),
                    execArgv: ['-r', 'source-map-support/register'],
                    allowRestarts: false,
                    input: process.cwd() + '/src/server.ts'
                })
            ],
        })
    }
}
