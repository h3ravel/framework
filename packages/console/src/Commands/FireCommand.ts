import { Command } from "./Command";
import { build } from 'tsdown'
import fs from 'node:fs/promises';
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
        const db = base_path('src/database')
        const dist = base_path('dist')
        const base = base_path('src/resources')
        const port = this.option('port')
        const host = this.option('host')
        const tries = this.option('tries')

        let child: ReturnType<typeof spawn> | null = null;

        await build({
            entry: ['src/**/*.ts'],
            format: ['esm', 'cjs'],
            target: 'node22',
            sourcemap: true,
            clean: true,
            shims: true,
            copy: ['public', { from: 'public', to: 'dist' }],
            watch: ['.env', '.env.*', base_path('src/**/*.*'), '../../packages/**/src/**/*.*'],
            async onSuccess () {

                /**
                 * Copy resources
                 */
                await fs.cp(base, dist, { recursive: true });
                await fs.cp(db, dist, { recursive: true });

                /**
                 * Kill previous server if running
                 */
                if (child) {
                    child.kill('SIGTERM');
                    child = null;
                }

                /**
                 * Start fresh server
                 */
                child = spawn("node", ['-r', 'tsconfig-paths/register', base_path('dist/server.js')], {
                    stdio: "inherit",
                    shell: true,
                    detached: false, // <-- important
                    env: {
                        ...process.env,
                        NODE_ENV: 'development',
                        SRC_PATH: 'dist',
                        HOSTNAME: host,
                        RETRIES: tries,
                        PORT: port,
                    }
                });
            },
            // onSuccess: `cp -r ${base} ${dist} && cp -r ${db} ${dist} ${postCmd}`,
            dts: false,
            silent: true,
            skipNodeModulesBundle: true,
        })
    }
}
