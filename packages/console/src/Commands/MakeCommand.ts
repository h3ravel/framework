import { TableGuesser, Utils } from "../Utils";
import { readFile, writeFile } from "node:fs/promises";

import { Command } from "./Command";
import chalk from "chalk";
import dayjs from "dayjs";
import { existsSync } from "node:fs";
import nodepath from "node:path";

export class MakeCommand extends Command {

    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected signature: string = `#make:
        {controller : Generates a new controller class. | {--a|api : Generate an API resource controller} | {--force : Overide existing controller.} }
        {resource : Generates a new API resource class.}
        {migration : Generates a new database migration class. | {--l|type=ts : The file type to generate} | {--t|table : The table to migrate}  | {--c|create : The table to be created} }
        {factory : Generates a new database factory class.}
        {seeder : Generates a new database seeder class.}
        {model : Generates a new Arquebus model class. | {--t|type=ts : The file type to generate}} 
        {^name : The name of the [name] to generate}
    `;
    /**
     * The console command description.
     *
     * @var string
     */
    protected description: string = 'Generate component classes';

    public async handle () {
        const command = this.dictionary.baseCommand as never

        const methods = {
            controller: 'makeController',
            resource: 'makeResource',
            migration: 'makeMigration',
            factory: 'makeFactory',
            seeder: 'makeSeeder',
            model: 'makeModel',
        } as const;

        try {
            await (this as any)?.[methods[command]]()
        } catch (e) {
            this.kernel.output.error(e as any)
        }
    }

    /**
     * Generate a new controller class.
     */
    protected async makeController () {
        const type = this.option('api') ? '-resource' : '';
        const name = this.argument('name')
        const force = this.option('force')

        const path = nodepath.join(app_path('Http/Controllers'), name + '.ts')
        const crtlrPath = Utils.findModulePkg('@h3ravel/http', this.kernel.cwd) ?? ''
        const stubPath = nodepath.join(crtlrPath, `dist/stubs/controller${type}.stub`)

        if (!force && existsSync(path)) {
            this.kernel.output.error(`ERORR: ${name} controller already exists`)
        }

        let stub = await readFile(stubPath, 'utf-8')
        stub = stub.replace(/{{ name }}/g, name)

        await writeFile(path, stub)
        this.kernel.output.split(`INFO: Controller Created`, chalk.gray(nodepath.basename(path)))
    }

    protected makeResource () {
        this.kernel.output.success(`Resource support is not yet available`)
    }

    /**
     * Generate a new database migration class
     */
    protected async makeMigration () {
        const name = this.argument('name')
        const datePrefix = dayjs().format('YYYY_MM_DD_HHmmss')
        const path = nodepath.join(database_path('migrations'), `${datePrefix}_${name}.ts`)

        const crtlrPath = Utils.findModulePkg('@h3ravel/database', this.kernel.cwd) ?? ''

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

        this.kernel.output.info('INFO: Creating Migration')

        await this.kernel.ensureDirectoryExists(nodepath.dirname(path))
        await writeFile(path, stub)

        this.kernel.output.split(`INFO: Migration Created`, chalk.gray(nodepath.basename(path)))
    }

    protected makeFactory () {
        this.kernel.output.success(`Factory support is not yet available`)
    }

    protected makeSeeder () {
        this.kernel.output.success(`Seeder support is not yet available`)
    }

    /**
     * Generate a new Arquebus model class
     */
    protected async makeModel () {
        const type = this.option('type', 'ts')
        const name = this.argument('name')
        // const force = this.argument('force')

        const path = nodepath.join(app_path('Models'), name.toLowerCase() + '.' + type)
        const crtlrPath = Utils.findModulePkg('@h3ravel/database', this.kernel.cwd) ?? ''
        const stubPath = nodepath.join(crtlrPath, `dist/stubs/model-${type}.stub`)

        let stub = await readFile(stubPath, 'utf-8')
        stub = stub.replace(/{{ name }}/g, name)

        await writeFile(path, stub)
        this.kernel.output.split(`INFO: Model Created`, chalk.gray(nodepath.basename(path)))
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
