import { IApplication } from '@h3ravel/contracts'

export abstract class IBootstraper {
    /**
     * Bootstrap the given application.
     */
    abstract bootstrap (app: IApplication): void | Promise<void>
}