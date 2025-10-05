import { Application } from '@h3ravel/core'
import { Arr } from '@h3ravel/support'
import { Seeder as BaseSeeder } from '@h3ravel/arquebus'
import { SeedCommand } from './Commands/SeedCommand'
import { TaskManager } from '@h3ravel/shared'

export class Seeder extends BaseSeeder {
    /**
     * Seeders that have been called at least one time.
     */
    static called: Seeder[] = []

    constructor(public app: Application, public command?: SeedCommand) {
        super()
    }

    async run (_conn?: SeedCommand['queryBuilder'], ..._args: any[]) { };

    /**
     * Run the given seeder class.
     *
     * @param className
     * @param silent
     * @param parameters
     * 
     * @return this
     */
    public async call (className: typeof Seeder | typeof Seeder[], silent = false, parameters: any[] = []) {
        const classes = Arr.wrap(className)

        for (let i = 0; i < classes.length; i++) {
            const instance = this.resolve(classes[i])
            const name = instance.constructor.name

            if (silent === false) {
                await TaskManager.advancedTaskRunner(
                    [[name, 'RUNNING'], [name, 'DONE']],
                    async () => await instance.run(this.command!.queryBuilder, ...parameters)
                )
            } else {
                await instance.run(this.command!.queryBuilder, ...parameters)
            }

            Seeder.called.push(instance)
        }

        return this
    }

    /**
     * Resolve an instance of the given seeder class.
     *
     * @param  className
     * 
     * @return Seeder
     */
    protected resolve (className: typeof Seeder) {
        const instance = new (className as { new(app: any): Seeder })(this.app)

        if (this.command) {
            instance.setCommand(this.command)
        }

        return instance
    }

    /**
     * Run the given seeder class.
     *
     * @param className
     * @param silent
     * @param parameters
     * 
     * @return void
     */
    public async callWith (className: typeof Seeder | typeof Seeder[], parameters: any[]) {
        await this.call(className, false, parameters)
    }

    /**
     * Silently run the given seeder class.
     *
     * @param className
     * @param parameters
     * 
     * @return void
     */
    public async callSilent (className: typeof Seeder | typeof Seeder[], parameters: any[] = []) {
        await this.call(className, true, parameters)
    }

    /**
     * Set the console command instance.
     *
     * @param  command
     * 
     * @return this
     */
    public setCommand (command: SeedCommand) {
        this.command = command

        return this
    }
}
