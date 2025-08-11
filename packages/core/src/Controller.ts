import { Application } from '.'
import { IController } from '@h3ravel/shared'

/**
 * Base controller class
 */
export abstract class Controller implements IController {
    protected app: Application

    constructor(app: Application) {
        this.app = app
    }

    public show (..._ctx: any[]): any { return }
    public index (..._ctx: any[]): any { return }
    public store (..._ctx: any[]): any { return }
    public update (..._ctx: any[]): any { return }
    public destroy (..._ctx: any[]): any { return }
}
