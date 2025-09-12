import { Command } from "./Command";
import { build } from 'tsup'

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
        const env = process.env.NODE_ENV || 'development'
        const dist = base_path('dist')
        const base = base_path('src/resources')
        const port = this.option('port')
        const host = this.option('host')
        const tries = this.option('tries')
        const devMode = env === 'development'

        const postCmd = devMode
            ? `&& NODE_ENV=${env} RETRIES=${tries} HOSTNAME=${host} PORT=${port} SRC_PATH=dist node -r tsconfig-paths/register dist/server.js`
            : ''

        await build({
            entry: ['src/**/*.ts'],
            format: ['esm', 'cjs'],
            target: 'node22',
            sourcemap: devMode,
            clean: true,
            shims: true,
            publicDir: true,
            watch: devMode ? ['.env', '.env.*', base_path('src/**/*.*'), '../../packages/**/src/**/*.*'] : false,
            onSuccess: `cp -r ${base} ${dist} && cp -r ${db} ${dist} ${postCmd}`,
            dts: false,
            silent: true,
            skipNodeModulesBundle: true,
        })
    }
}
