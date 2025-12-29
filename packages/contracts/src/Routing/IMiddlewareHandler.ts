import type { IHttpContext } from '../Http/IHttpContext'
import type { IMiddleware } from './IMiddleware'

export declare class IMiddlewareHandler {
    /**
     * Registers a middleware instance.
     *
     * @param mw
     */
    register (mw: IMiddleware | IMiddleware[]): this;
    /**
     * Runs the middleware chain for a given HttpContext.
     * Each middleware must call next() to continue the chain.
     *
     * @param context - The current HttpContext.
     * @param next - Callback to execute when middleware completes.
     * @returns A promise resolving to the final handler's result.
     */
    run (context: IHttpContext, next: (ctx: IHttpContext) => Promise<any>): Promise<any>;
}