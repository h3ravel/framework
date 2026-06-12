import { IFilesystemManager } from 'h3ravel/foundation'

export { }

declare module '@h3ravel/contracts' {
    interface Bindings {
        'storage': IFilesystemManager
    }
}
