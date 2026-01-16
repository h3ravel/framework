import { Application } from '.'
import { IController } from '@h3ravel/contracts'

/**
 * Base controller class
 */
export abstract class Controller extends IController {
    protected app: Application

    constructor(app?: Application) {
        super()
        this.app = app!
    }
}
