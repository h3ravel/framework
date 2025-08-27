import { Command } from "./Command";
import { spawn } from "node:child_process";

export class ServeCommand extends Command {

    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected signature: string = 'serve';

    /**
     * The console command description.
     *
     * @var string
     */
    protected description: string = 'Start the Developement Server';

    public async handle () {
        try {
            await this.serve()
        } catch (e) {
            this.kernel.output.error(e as any)
        }
    }

    protected async serve () {
        const child = spawn("tsup-node", {
            stdio: "inherit",
            shell: true,
            env: Object.assign({}, process.env, { NODE_ENV: 'development' }),
            detached: true
        });

        const cleanup = () => {
            console.log(111111)
            if (child.pid) {
                process.kill(child.pid, 'SIGTERM')
            }
        }

        process.on("SIGINT", () => child.kill("SIGINT"));
        process.on("SIGTERM", () => child.kill("SIGTERM"));

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
