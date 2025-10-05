import { FileSystem, Logger } from '@h3ravel/shared'
import { mkdir, readFile, writeFile } from 'node:fs/promises'

import { Command } from './Command'
import { Str } from '@h3ravel/support'
import nodepath from 'node:path'

export class MakeCommand extends Command {

    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected signature: string = `#make:
        {controller : Create a new controller class. 
            | {--a|api : Exclude the create and edit methods from the controller} 
            | {--m|model= : Generate a resource controller for the given model} 
            | {--r|resource : Generate a resource controller class} 
            | {--force : Create the controller even if it already exists}
        }
        {resource : Create a new resource. 
            | {--c|collection : Create a resource collection}
            | {--force : Create the resource even if it already exists}
        }
        {command : Create a new Musket command. 
            | {--command : The terminal command that will be used to invoke the class} 
            | {--force : Create the class even if the console command already exists}
        }
        {view : Create a new view.
            | {--force : Create the view even if it already exists}
        }
        {^name : The name of the [name] to generate}
    `
    /**
     * The console command description.
     *
     * @var string
     */
    protected description: string = 'Generate component classes'

    public async handle (this: any) {
        const command = (this.dictionary.baseCommand ?? this.dictionary.name) as never

        if (!this.argument('name')) {
            this.program.error('Please provide a valid name for the ' + command)
        }

        const methods = {
            controller: 'makeController',
            resource: 'makeResource',
            view: 'makeView',
            command: 'makeCommand',
        } as const

        await this[methods[command]]()
    }

    /**
     * Create a new controller class.
     */
    protected async makeController () {
        const type = this.option('api') ? '-resource' : ''
        const name = this.argument('name')
        const force = this.option('force')

        const crtlrPath = FileSystem.findModulePkg('@h3ravel/http', this.kernel.cwd) ?? ''
        const stubPath = nodepath.join(crtlrPath, `dist/stubs/controller${type}.stub`)
        const path = app_path(`Http/Controllers/${name}.ts`)

        /** The Controller is scoped to a path make sure to create the associated directories */
        if (name.includes('/')) {
            await mkdir(Str.beforeLast(path, '/'), { recursive: true })
        }

        /** Check if the controller already exists */
        if (!force && await FileSystem.fileExists(path)) {
            Logger.error(`ERORR: ${name} controller already exists`)
        }

        let stub = await readFile(stubPath, 'utf-8')
        stub = stub.replace(/{{ name }}/g, name)

        await writeFile(path, stub)
        Logger.split('INFO: Controller Created', Logger.log(nodepath.basename(path), 'gray', false))
    }

    protected makeResource () {
        Logger.success('Resource support is not yet available')
    }

    /**
     * Create a new Musket command
     */
    protected makeCommand () {
        Logger.success('Musket command creation is not yet available')
    }

    /**
     * Create a new view.
     */
    protected async makeView () {
        const name = this.argument('name')
        const force = this.option('force')

        const path = base_path(`src/resources/views/${name}.edge`)

        /** The view is scoped to a path make sure to create the associated directories */
        if (name.includes('/')) {
            await mkdir(Str.beforeLast(path, '/'), { recursive: true })
        }

        /** Check if the view already exists */
        if (!force && await FileSystem.fileExists(path)) {
            Logger.error(`ERORR: ${name} view already exists`)
        }

        await writeFile(path, `{{-- src/resources/views/${name}.edge --}}`)
        Logger.split('INFO: View Created', Logger.log(`src/resources/views/${name}.edge`, 'gray', false))
    }
}
