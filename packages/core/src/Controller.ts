import { HttpContext } from '@h3ravel/http'

/**
 * Add shared logic for controllers here (middleware, helpers, etc.)
 */
export abstract class Controller {
    public show (_ctx: HttpContext): any {
        return
    }
    public index (_ctx: HttpContext): any {
        return
    }
    public store (_ctx: HttpContext): any {
        return
    }
    public update (_ctx: HttpContext): any {
        return
    }
    public destroy (_ctx: HttpContext): any {
        return
    }
}
