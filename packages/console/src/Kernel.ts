import { Application } from "@h3ravel/core";
import { Logger } from "@h3ravel/shared";
import { Musket } from "./Musket";
import { Utils } from "./Utils";
import { XGeneric } from "@h3ravel/support";
import { mkdir } from "node:fs/promises";
import path from "node:path";

export class Kernel {
    public cwd!: string
    public output = Logger.log()
    public basePath: string = ''
    public modulePath!: string
    public consolePath!: string
    public modulePackage!: XGeneric<{ version: string }>
    public consolePackage!: XGeneric<{ version: string }>

    constructor(public app: Application, basePath?: string) { }

    static init (app: Application) {
        const instance = new Kernel(app)

        Promise.all([instance.loadRequirements()])
            .then(([e]) => e.run())
    }


    private async run () {
        await Musket.parse(this);
        process.exit(0)
    }

    async ensureDirectoryExists (dir: string) {
        await mkdir(dir, { recursive: true })
    }

    private async loadRequirements () {
        this.cwd = path.join(process.cwd(), this.basePath)
        this.modulePath = Utils.findModulePkg('@h3ravel/core', this.cwd) ?? ''
        this.consolePath = Utils.findModulePkg('@h3ravel/console', this.cwd) ?? ''

        try {
            this.modulePackage = await import(path.join(this.modulePath, 'package.json'))
        } catch {
            this.modulePackage = { version: 'N/A' }
        }

        try {
            this.consolePackage = await import(path.join(this.consolePath, 'package.json'))
        } catch {
            this.consolePackage = { version: 'N/A' }
        }

        return this
    }
}
