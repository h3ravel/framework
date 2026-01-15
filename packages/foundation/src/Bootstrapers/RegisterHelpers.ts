import { IApplication, IBootstraper } from '@h3ravel/contracts'

import { Helpers } from '../Helpers'

export class RegisterHelpers extends IBootstraper {
    /**
     * Bootstrap application helpers.
     */
    bootstrap (app: IApplication) {
        Helpers.load(app)
    }
}