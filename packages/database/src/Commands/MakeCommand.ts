import { FileSystem, Logger } from '@h3ravel/shared'
import { mkdir, readFile, writeFile } from 'node:fs/promises'

import { Command } from '@h3ravel/musket'
import { Str } from '@h3ravel/support'
import { TableGuesser } from '../Utils/TableGuesser'
import dayjs from 'dayjs'
import npath from 'node:path'

export class MakeCommand extends Command {

    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected signature: string = `#make:
        {migration : Generates a new database migration class. 
            | {--t|table : The table to migrate} 
            | {--c|create : The table to be created} 
            | {--l|type=ts : The file type to generate} 
        } 
        {factory : Create a new model factory.
            | {--force : Create the factory even if it already exists}
            | {--l|type=ts : The file type to generate}
        }
        {seeder : Create a new seeder class.
            | {--force : Create the seeder even if it already exists}
            | {--l|type=ts : The file type to generate}
        }
        {model : Create a new Eloquent model class. 
            | {--api : Indicates if the generated controller should be an API resource controller} 
            | {--c|controller : Create a new controller for the model} 
            | {--f|factory : Create a new factory for the model} 
            | {--m|migration : Create a new migration file for the model} 
            | {--r|resource : Indicates if the generated controller should be a resource controller} 
            | {--a|all : Generate a migration, seeder, factory, policy, resource controller, and form request classes for the model} 
            | {--s|seed : Create a new seeder for the model}
            | {--l|type=ts : The file type to generate}
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

    public async handle (this: any) {
        const command = (this.dictionary.baseCommand ?? this.dictionary.name) as never

        if (!this.argument('name')) {
            this.program.error('Please provide a valid name for the ' + command)
        }

        const methods = {
            migration: 'makeMigration', // ✓
            factory: 'makeFactory',
            seeder: 'makeSeeder', // ✓
            model: 'makeModel', // ✓
        } as const

        console.log('')

        await this[methods[command]]()
    }

    /**
     * Generate a new database migration class
     */
    protected async makeMigration () {
        const type = this.option('type', 'ts')
        const name = this.argument('name')
        const datePrefix = dayjs().format('YYYY_MM_DD_HHmmss')
        const path = database_path(`migrations/${datePrefix}_${name}.${type}`)

        const dbPkgPath = FileSystem.findModulePkg('@h3ravel/database', this.kernel.cwd) ?? ''

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

        const stubPath = npath.join(dbPkgPath, this.getStubName('migration', type, { table, create }))
        let stub = await readFile(stubPath, 'utf-8')

        if (table !== null) {
            stub = stub.replace(/DummyTable|{{\s*table\s*}}/g, table)
        }

        Logger.info('INFO: Creating Migration')

        await this.kernel.ensureDirectoryExists(npath.dirname(path))
        await writeFile(path, stub)

        Logger.split('INFO: Migration Created', Logger.log(npath.basename(path), 'gray', false))
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
    protected async makeSeeder () {
        const type = this.option('type', 'ts')
        const name = this.argument('name')
        const force = this.option('force')
        const path = database_path(`seeders/${Str.snake(name)}.${type}`)

        /** Check if the model already exists */
        if (!force && await FileSystem.fileExists(path)) {
            Logger.error(`ERORR: ${name} already exists`)
        }

        const dbPkgPath = FileSystem.findModulePkg('@h3ravel/database', this.kernel.cwd) ?? ''
        const stubPath = npath.join(dbPkgPath, this.getStubName('seeder', type))

        let stub = await readFile(stubPath, 'utf-8')
        stub = stub.replace(/{{ name }}/g, name)

        await writeFile(path, stub)

        Logger.info(
            `INFO: Seeder ${Logger.log(`[${npath.relative(process.cwd(), path)}]`, 'bold', false)} created successfully.`
        )
    }

    /**
     * Generate a new Arquebus model class
     */
    protected async makeModel () {
        const type = this.option('type', 'ts')
        const name = this.argument('name')
        const force = this.option('force')

        const path = app_path(`Models/${Str.lower(name)}.${type}`)

        /** The model is scoped to a path make sure to create the associated directories */
        if (name.includes('/')) {
            await mkdir(Str.beforeLast(path, '/'), { recursive: true })
        }

        /** Check if the model already exists */
        if (!force && await FileSystem.fileExists(path)) {
            Logger.error(`ERORR: ${name} model already exists`)
        }

        const dbPkgPath = FileSystem.findModulePkg('@h3ravel/database', this.kernel.cwd) ?? ''
        const stubPath = npath.join(dbPkgPath, `dist/stubs/model-${type}.stub`)

        let stub = await readFile(stubPath, 'utf-8')
        stub = stub.replace(/{{ name }}/g, name)

        await writeFile(path, stub)

        Logger.info(
            `INFO: Model ${Logger.log(`[${npath.relative(process.cwd(), path)}]`, 'bold', false)} created successfully.`
        )
    }

    /**
     * Ge the database migration file name
     * 
     * @param table 
     * @param create 
     * @param type 
     * @returns 
     */
    getStubName (
        type: 'migration' | 'seeder' | 'model' | 'factory',
        ext: 'ts' | 'js' = 'ts',
        { table, create }: { table?: string, create?: boolean } = {}
    ) {
        let stub: string
        if (type === 'migration') {
            if (!table) {
                stub = `migration-${ext}.stub`
            }
            else if (create) {
                stub = `migration.create-${ext}.stub`
            }
            else {
                stub = `migration.update-${ext}.stub`
            }
            return 'dist/stubs/' + stub
        } else {
            return `dist/stubs/${type}-${ext}.stub`
        }
    }
}
