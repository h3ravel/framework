import { Arr, Obj } from '@h3ravel/support'
import type { IHttpContext, IMiddleware, IRouter } from '@h3ravel/contracts'

import { Application } from '..'
import type { H3Event } from 'h3'
import { MiddlewareHandler } from '@h3ravel/foundation'
import { Resolver } from '@h3ravel/shared'

/**
 * Kernel class handles middleware execution and response transformations.
 * It acts as the core middleware pipeline for HTTP requests.
 */
export class Kernel {

  /**
   * The router instance.
   */
  protected router: IRouter

  /**
   * A factory function that converts an H3Event into an HttpContext.
   */
  protected context: (event: H3Event) => IHttpContext | Promise<IHttpContext>
  protected applicationContext!: IHttpContext

  /**
   * @param app - The current application instance
   * @param middleware - An array of middleware classes that will be executed in sequence.
   */
  constructor(
    public app: Application,
    public middleware: IMiddleware[] = [],
  ) {
    this.router = app.make('router')
    this.context = async (event) => app.context!(event)
  }

  /**
   * Handles an incoming request and passes it through middleware before invoking the next handler.
   * 
   * @param event - The raw H3 event object.
   * @param next - A callback function that represents the next layer (usually the controller or final handler).
   * @returns A promise resolving to the result of the request pipeline.
   */
  async handle (
    event: H3Event,
    next: (ctx: IHttpContext) => Promise<unknown>
  ): Promise<unknown> {
    const { request } = await this.app.context!(event)
    /**
     * Convert the raw event into a standardized HttpContext
     */
    this.applicationContext = await this.context(event)

    /**
     * Bind HttpContext, request, and response to the container
     */
    this.app.bind('http.context', () => this.applicationContext)
    this.app.bind('http.request', () => this.applicationContext.request)
    this.app.bind('http.response', () => this.applicationContext.response)

    // Resolve or create MiddlewareHandler
    this.app.middlewareHandler = this.app.has(MiddlewareHandler)
      ? this.app.make(MiddlewareHandler)
      : new MiddlewareHandler([], this.app);

    (request.constructor as any).enableHttpMethodParameterOverride()

    /**
     * Run middleware stack and obtain result
     */
    const result = await this.app.middlewareHandler
      .register(this.middleware)
      .run(this.applicationContext, next)

    /**
   * If a plain object is returned from a controller or middleware,
   * automatically set the JSON Content-Type header for the response.
   */
    if (result !== undefined && Obj.isPlainObject(result, true) && !result?.headers) {
      event.res.headers.set('Content-Type', 'application/json; charset=UTF-8')
    }

    return result
  }

  /**
   * Resolve the provided callback using the current H3 event instance 
   */
  public async resolve (
    event: H3Event,
    middleware: IMiddleware | IMiddleware[],
    handler: (ctx: IHttpContext) => Promise<any>
  ): Promise<any> {
    const { Response } = await import('@h3ravel/http')

    this.middleware = Array.from(new Set([...this.middleware, ...Arr.wrap(middleware)]))

    return this.handle(event, (ctx) => new Promise((resolve) => {
      if (Resolver.isAsyncFunction(handler)) {
        handler(ctx).then((response: any) => {

          if (response instanceof Response) {
            resolve(response.prepare(ctx.request as never).send())
          } else {
            resolve(response)
          }
        })
      } else {
        resolve(handler(ctx))
      }
    }))
  }
}
