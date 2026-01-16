import { IApplication, IBootstraper } from '@h3ravel/contracts'

export class BootProviders extends IBootstraper {
    /**
     * Bootstrap the given application.
     */
    async bootstrap (app: IApplication) {
        await app.boot()
    }
}