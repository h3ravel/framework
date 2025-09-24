import { FileSystem, Logger } from '@h3ravel/shared'
import { mkdir, readFile, writeFile } from 'node:fs/promises'

import { Command } from './Command'
import { TableGuesser } from '../Utils'
import { beforeLast } from '@h3ravel/support'
import dayjs from 'dayjs'
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
        {migration : Generates a new database migration class. 
            | {--l|type=ts : The file type to generate} 
            | {--t|table : The table to migrate} 
            | {--c|create : The table to be created} 
        }
        {factory : Create a new model factory.}
        {seeder : Create a new seeder class.}
        {view : Create a new view.
            | {--force : Create the view even if it already exists}
        }
        {model : Create a new Eloquent model class. 
            | {--api : Indicates if the generated controller should be an API resource controller} 
            | {--c|controller : Create a new controller for the model} 
            | {--f|factory : Create a new factory for the model} 
            | {--m|migration : Create a new migration file for the model} 
            | {--r|resource : Indicates if the generated controller should be a resource controller} 
            | {--a|all : Generate a migration, seeder, factory, policy, resource controller, and form request classes for the model} 
            | {--s|seed : Create a new seeder for the model} 
            | {--t|type=ts : The file type to generate}
            | {--force : Create the model even if it already exists}
        } 
        {^name : The name of the [name] to generate}
    `
    /**
     * The console command description.
     *
     * @var string
     */
    protected description: string = 'Generate component classes'

    public async handle () {
        const command = (this.dictionary.baseCommand ?? this.dictionary.name) as never

        if (!this.argument('name')) {
            this.program.error('Please provide a valid name for the ' + command)
        }

        const methods = {
            controller: 'makeController',
            resource: 'makeResource',
            migration: 'makeMigration',
            factory: 'makeFactory',
            seeder: 'makeSeeder',
            model: 'makeModel',
            view: 'makeView',
        } as const

        try {
            await (this as any)?.[methods[command]]()
        } catch (e) {
            Logger.error(e as any)
        }
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
            await mkdir(beforeLast(path, '/'), { recursive: true })
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
     * Generate a new database migration class
     */
    protected async makeMigration () {
        const name = this.argument('name')
        const datePrefix = dayjs().format('YYYY_MM_DD_HHmmss')
        const path = database_path(`migrations/${datePrefix}_${name}.ts`)

        const crtlrPath = FileSystem.findModulePkg('@h3ravel/database', this.kernel.cwd) ?? ''

        let create = this.option('create', false)
        let table = this.option('table')
        if (!table && typeof create === 'string') {
            table = create
            create = true
        }

        if (!table) {
            const guessed = TableGuesser.guess(name)
            table = guessed[0]
            create = !!guessed[1]
        }

        const stubPath = nodepath.join(crtlrPath, this.getMigrationStubName(table, create))
        let stub = await readFile(stubPath, 'utf-8')

        if (table !== null) {
            stub = stub.replace(/DummyTable|{{\s*table\s*}}/g, table)
        }

        Logger.info('INFO: Creating Migration')

        await this.kernel.ensureDirectoryExists(nodepath.dirname(path))
        await writeFile(path, stub)

        Logger.split('INFO: Migration Created', Logger.log(nodepath.basename(path), 'gray', false))
    }

    /**
     * Create a new model factory
     */
    protected makeFactory () {
        Logger.success('Factory support is not yet available')
    }

    /**
     * Create a new seeder class
     */
    protected makeSeeder () {
        Logger.success('Seeder support is not yet available')
    }

    /**
     * Generate a new Arquebus model class
     */
    protected async makeModel () {
        const type = this.option('type', 'ts')
        const name = this.argument('name')
        const force = this.option('force')

        const path = app_path(`Models/${name.toLowerCase()}.${type}`)

        /** The model is scoped to a path make sure to create the associated directories */
        if (name.includes('/')) {
            await mkdir(beforeLast(path, '/'), { recursive: true })
        }

        /** Check if the model already exists */
        if (!force && await FileSystem.fileExists(path)) {
            Logger.error(`ERORR: ${name} model already exists`)
        }

        const crtlrPath = FileSystem.findModulePkg('@h3ravel/database', this.kernel.cwd) ?? ''
        const stubPath = nodepath.join(crtlrPath, `dist/stubs/model-${type}.stub`)

        let stub = await readFile(stubPath, 'utf-8')
        stub = stub.replace(/{{ name }}/g, name)

        await writeFile(path, stub)
        Logger.split(`INFO: ${name} Model Created`, Logger.log(nodepath.basename(path), 'gray', false))
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
            await mkdir(beforeLast(path, '/'), { recursive: true })
        }

        /** Check if the view already exists */
        if (!force && await FileSystem.fileExists(path)) {
            Logger.error(`ERORR: ${name} view already exists`)
        }

        await writeFile(path, `{{-- src/resources/views/${name}.edge --}}`)
        Logger.split('INFO: View Created', Logger.log(`src/resources/views/${name}.edge`, 'gray', false))
    }

    /**
     * Ge the database migration file name
     * 
     * @param table 
     * @param create 
     * @param type 
     * @returns 
     */
    getMigrationStubName (table?: string, create: boolean = false, type: 'ts' | 'js' = 'ts') {
        let stub: string
        if (!table) {
            stub = `migration-${type}.stub`
        }
        else if (create) {
            stub = `migration.create-${type}.stub`
        }
        else {
            stub = `migration.update-${type}.stub`
        }
        return 'dist/stubs/' + stub
    }
}
