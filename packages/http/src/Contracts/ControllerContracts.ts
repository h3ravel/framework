import { HttpContext } from "./HttpContract"

/**
 * Defines the contract for all controllers.
 * Any controller implementing this must define these methods.
 */
export interface IController {
    show (ctx: HttpContext): any
    index (ctx: HttpContext): any
    store (ctx: HttpContext): any
    update (ctx: HttpContext): any
    destroy (ctx: HttpContext): any
}
