import { HttpContext, IMiddleware } from '@h3ravel/shared'

import type { H3Event } from 'h3'

/**
 * Kernel class handles middleware execution and response transformations.
 * It acts as the core middleware pipeline for HTTP requests.
 */
export class Kernel {
  /**
   * @param context - A factory function that converts an H3Event into an HttpContext.
   * @param middleware - An array of middleware classes that will be executed in sequence.
   */
  constructor(
    protected context: (event: H3Event) => HttpContext | Promise<HttpContext>,
    protected middleware: IMiddleware[] = [],
  ) { }

  /**
   * Handles an incoming request and passes it through middleware before invoking the next handler.
   * 
   * @param event - The raw H3 event object.
   * @param next - A callback function that represents the next layer (usually the controller or final handler).
   * @returns A promise resolving to the result of the request pipeline.
   */
  async handle (
    event: H3Event,
    next: (ctx: HttpContext) => Promise<unknown>
  ): Promise<unknown> {
    /**
     * Convert the raw event into a standardized HttpContext
     */
    const ctx = await this.context(event)

    const { app } = ctx.request

    /** 
     * Bind HTTP Response instance to the service container
     */
    app.bind('http.response', () => {
      return ctx.response
    })

    /** 
     * Bind HTTP Request instance to the service container
     */
    app.bind('http.request', () => {
      return ctx.request
    })

    /**
     * Run middleware stack and obtain result
     */
    const result = await this.runMiddleware(ctx, () => next(ctx))

    /**
     * If a plain object is returned from a controller or middleware,
     * automatically set the JSON Content-Type header for the response.
     */
    if (result !== undefined && this.isPlainObject(result)) {
      event.res.headers.set('Content-Type', 'application/json; charset=UTF-8')
    }

    return result
  }

  /**
   * Sequentially runs middleware in the order they were registered.
   * 
   * @param context - The standardized HttpContext.
   * @param next - Callback to execute when middleware completes.
   * @returns A promise resolving to the final handler's result.
   */
  private async runMiddleware (
    context: HttpContext,
    next: (ctx: HttpContext) => Promise<unknown>
  ) {
    let index = -1

    const runner = async (i: number): Promise<unknown> => {
      if (i <= index) throw new Error('next() called multiple times')
      index = i
      const middleware = this.middleware[i]

      if (middleware) {
        /**
         * Execute the current middleware and proceed to the next one
         */
        return middleware.handle(context, () => runner(i + 1))
      } else {
        /**
         * If no more middleware, call the final handler
         */
        return next(context)
      }
    }

    return runner(0)
  }

  /**
   * Utility function to determine if a value is a plain object or array.
   * 
   * @param value - The value to check.
   * @returns True if the value is a plain object or array, otherwise false.
   */
  private isPlainObject (value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' &&
      value !== null &&
      (value.constructor === Object || value.constructor === Array)
  }
}
