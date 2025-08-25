import { dd, dump } from '@h3ravel/support'

import { Application } from '.'
import nodepath from 'node:path'

export class Registerer {
    constructor(private app: Application) { }

    static register (app: Application) {
        const reg = new Registerer(app)

        globalThis.dd = dd
        globalThis.dump = dump
        globalThis.app_path = (path?: string) => reg.appPath(path)
        globalThis.base_path = (path?: string) => reg.basePath(path)
        globalThis.public_path = (path?: string) => reg.publicPath(path)
        globalThis.storage_path = (path?: string) => reg.storagePath(path)
        globalThis.database_path = (path?: string) => reg.databasePath(path)
    }

    private appPath (path?: string) {
        return this.app.getPath('base', nodepath.join('src/app', path ?? ''))
    }

    private basePath (path?: string) {
        return this.app.getPath('base', path)
    }

    private publicPath (path?: string) {
        return this.app.getPath('public', path)
    }

    private storagePath (path?: string) {
        return this.app.getPath('base', nodepath.join('storage', path ?? ''))
    }

    private databasePath (path?: string) {
        return this.app.getPath('database', path)
    }
}
