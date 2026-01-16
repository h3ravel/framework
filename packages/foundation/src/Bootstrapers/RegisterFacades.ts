import { IApplication, IBootstraper } from '@h3ravel/contracts'

import { Facades } from '@h3ravel/support/facades'

export class RegisterFacades extends IBootstraper {
    /**
     * Bootstrap the given application.
     */
    bootstrap (app: IApplication) {
        Facades.clearResolvedInstances()

        Facades.setApplication(app)
    }
}