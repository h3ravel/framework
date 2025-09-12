import { Command } from "./Command";
import { build } from 'tsup'
// import { spawn } from "node:child_process";

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
        console.log(process.cwd())
        // await build({
        //     entry: ['src/index.ts'],
        //     sourcemap: true,
        //     dts: true,
        // })
        // const child = spawn("tsup-node", {
        //     stdio: "inherit",
        //     shell: true,
        //     env: Object.assign({}, process.env, { NODE_ENV: 'development' }),
        //     detached: false
        // });

        const cleanup = () => {
            console.log(111111)
            // if (child.pid) {
            //     process.kill(child.pid, 'SIGTERM')
            // }
        }

        process.on('SIGINT', () => {
            cleanup()
            process.exit(0)
        })

        process.on('SIGTERM', () => {
            cleanup()
            process.exit(0)
        })
    }
}
