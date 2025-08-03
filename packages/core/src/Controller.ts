import { HttpContext, IController } from '@h3ravel/shared'

import { Application } from '.'

/**
 * Base controller class
 */
export abstract class Controller implements IController {
    protected app: Application

    constructor(app: Application) {
        this.app = app
    }

    public show (_ctx: HttpContext): any { return }
    public index (_ctx: HttpContext): any { return }
    public store (_ctx: HttpContext): any { return }
    public update (_ctx: HttpContext): any { return }
    public destroy (_ctx: HttpContext): any { return }
}
