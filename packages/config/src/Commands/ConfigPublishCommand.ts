import { FileSystem, Logger } from '@h3ravel/shared'
import { readFile, writeFile } from 'node:fs/promises'

import { ConsoleCommand } from '@h3ravel/core'
import { Str } from '@h3ravel/support'
import npath from 'node:path'

export class ConfigPublishCommand extends ConsoleCommand {

    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected signature: string = `config:publish
        {name? : The name of the configuration file to publish}
        {--all : Publish all configuration files}
        {--force : Overwrite any existing configuration files}
    `
    /**
     * The console command description.
     *
     * @var string
     */
    protected description: string = 'Publish configuration files to your application'

    /**
     * List available config files
     */
    protected configs = [
        'hashing'
    ] as const

    /**
     * Create a new seeder class
     */
    public async handle () {
        const all = this.option('all')
        if (all) {
            await Promise.all(this.configs.map(e => this.publish(e)))
        } else {
            const name = this.argument('name')
            if (!name) Logger.error('ERORR: enter a configuration name or pass the --all flag to publish all available configurations.')
            await this.publish(name)
        }
    }

    /**
     * Create a new seeder class
     */
    protected async publish (name: 'hashing') {
        const force = this.option('force')
        const path = base_path(`src/config/${Str.snake(name)}.ts`)

        // Check if the config already exists
        if (!force && await FileSystem.fileExists(path)) {
            this.error(`ERORR: ${name} already exists`)
        }

        const dbPkgPath = FileSystem.findModulePkg('@h3ravel/config', this.kernel.cwd) ?? ''
        const stubPath = npath.join(dbPkgPath, this.getStubName(name))

        // Check if the stub exists
        if (!await FileSystem.fileExists(stubPath)) {
            this.error(`ERORR: Config [${name}] does not exist`)
        }

        await writeFile(path, await readFile(stubPath, 'utf-8'))

        this.info(
            `INFO: Config ${Logger.log(`[${npath.relative(process.cwd(), path)}]`, 'bold', false)} published successfully.`
        )
    }

    /**
     * Get the configuration file to publish
     * 
     * @param name 
     * @returns 
     */
    getStubName (name: 'hashing') {
        return `dist/stubs/${name}.stub`
    }
}
