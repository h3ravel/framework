import { Application, ConsoleKernel } from '@h3ravel/core'

import { Helpers } from '@h3ravel/filesystem'
import { Musket } from './Musket'
import path from 'node:path'

export class Kernel extends ConsoleKernel {
    constructor(public app: Application) {
        super(app)
    }

    static init (app: Application) {
        const instance = new Kernel(app)

        Promise.all([instance.loadRequirements()])
            .then(([e]) => e.run())
    }


    private async run () {
        await Musket.parse(this)
        process.exit(0)
    }

    private async loadRequirements () {
        this.cwd = path.join(process.cwd(), this.basePath)
        this.modulePath = Helpers.findModulePkg('@h3ravel/core', this.cwd) ?? ''
        this.consolePath = Helpers.findModulePkg('@h3ravel/console', this.cwd) ?? ''

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
