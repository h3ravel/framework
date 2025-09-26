import 'reflect-metadata'
import { H3Event, Middleware, MiddlewareOptions, type H3 } from 'h3'
import { Application, Container, Kernel } from '@h3ravel/core'
import { Request, Response } from '@h3ravel/http'
import { singularize } from '@h3ravel/support'
import { HttpContext, RouteEventHandler } from '@h3ravel/shared'
import type { EventHandler, IController, IMiddleware, IRouter, RouterEnd } from '@h3ravel/shared'
import { Helpers } from './Helpers'
import { Model } from '@h3ravel/database'
import { RouteDefinition, RouteMethod } from './Contracts/Router'

export class Router implements IRouter {
    private routes: RouteDefinition[] = []
    private nameMap: string[] = []
    private groupPrefix = ''
    private middlewareMap: IMiddleware[] = []
    private groupMiddleware: EventHandler[] = []

    constructor(protected h3App: H3, private app: Application) { }

    /**
     * Route Resolver
     * 
     * @param handler 
     * @param middleware 
     * @returns 
     */
    private resolveHandler (handler: EventHandler, middleware: IMiddleware[] = []) {
        return async (event: H3Event) => {
            const kernel = new Kernel(() => HttpContext.init({
                app: this.app,
                request: new Request(event, this.app),
                response: new Response(event, this.app)
            }), middleware)

            return kernel.handle(event, (ctx) => Promise.resolve(handler(ctx)))
        }
    }

    /**
     * Add a route to the stack
     * 
     * @param method 
     * @param path 
     * @param handler 
     * @param name 
     * @param middleware 
     */
    private addRoute (
        method: RouteMethod,
        path: string,
        handler: EventHandler,
        name?: string,
        middleware: IMiddleware[] = [],
        signature: RouteDefinition['signature'] = ['', '']
    ) {
        /**
         * Join all defined route names to make a single route name
         */
        if (this.nameMap.length > 0) {
            name = this.nameMap.join('.')
        }

        /**
         * Join all defined middlewares
         */
        if (this.middlewareMap.length > 0) {
            middleware = this.middlewareMap
        }

        const fullPath = `${this.groupPrefix}${path}`.replace(/\/+/g, '/')
        this.routes.push({ method, path: fullPath, name, handler, signature })
        this.h3App[method as 'get'](fullPath, this.resolveHandler(handler, middleware))
        this.app.singleton<any>('routes', () => this.routes)
    }

    /**
     * Resolves a route handler definition into an executable EventHandler.
     *
     * A handler can be:
     *   - A function matching the EventHandler signature
     *   - A controller class (optionally decorated for IoC resolution)
     *
     * If it’s a controller class, this method will:
     *   - Instantiate it (via IoC or manually)
     *   - Call the specified method (defaults to `index`)
     *
     * @param handler     Event handler function OR controller class
     * @param methodName  Method to invoke on the controller (defaults to 'index')
     */
    private resolveControllerOrHandler (
        handler: EventHandler | (new (...args: any[]) => Record<string, any>),
        methodName?: string,
        path?: string,
    ): EventHandler {
        /**
         * Checks if the handler is a function (either a plain function or a class constructor)
         */
        if (typeof handler === 'function' && typeof (handler as any).prototype !== 'undefined') {
            return async (ctx) => {
                let controller: IController
                if (Container.hasAnyDecorator(handler as any)) {
                    /**
                     * If the controller is decorated use the IoC container
                     */
                    controller = this.app.make<any, IController>(handler as any)
                } else {
                    /**
                     * Otherwise instantiate manually so that we can at least
                     * pass the app instance
                     */
                    controller = new (handler as new (...args: any[]) => IController)(this.app)
                }

                /**
                 * The method to execute (defaults to 'index')
                 */
                const action = (methodName || 'index') as keyof IController

                /**
                 * Ensure the method exists on the controller
                 */
                if (typeof controller[action] !== 'function') {
                    throw new Error(`Method "${String(action)}" not found on controller ${handler.name}`)
                }

                /**
                 * Get param types for the controller method
                 */
                const paramTypes: [] = Reflect.getMetadata('design:paramtypes', controller, action) || []

                /**
                 * Resolve the bound dependencies
                 */
                let args = await Promise.all(
                    paramTypes.map(async (paramType: any) => {
                        switch (paramType?.name) {
                            case 'Application':
                                return this.app
                            case 'Request':
                                return ctx.request
                            case 'Response':
                                return ctx.response
                            case 'HttpContext':
                                return ctx
                            default: {
                                const inst = this.app.make(paramType)
                                if (inst instanceof Model) {
                                    // Route model binding returns a Promise
                                    return await Helpers.resolveRouteModelBinding(path ?? '', ctx, inst)
                                }
                                return inst
                            }
                        }
                    })
                )

                /**
                 * Ensure that the HttpContext is always available
                 */
                if (args.length < 1) {
                    args = [ctx]
                }

                /**
                 * Call the controller method, passing all resolved dependencies
                 */
                return await controller[action](...args)
            }
        }

        return handler as EventHandler
    }

    /**
     * Registers a route that responds to HTTP GET requests.
     *
     * @param path        The URL pattern to match (can include parameters, e.g., '/users/:id').
     * @param definition  Either:
     *                      - An EventHandler function
     *                      - A tuple: [ControllerClass, methodName]
     * @param name        Optional route name (for URL generation or referencing).
     * @param middleware  Optional array of middleware functions to execute before the handler.
     */
    get (
        path: string,
        definition: RouteEventHandler | [(new (...args: any[]) => Record<string, any>), methodName: string],
        name?: string,
        middleware: IMiddleware[] = []
    ): Omit<this, RouterEnd> {
        const handler = Array.isArray(definition) ? definition[0] : definition
        const methodName = Array.isArray(definition) ? definition[1] : undefined

        this.addRoute('get', path, this.resolveControllerOrHandler(handler, methodName, path), name, middleware, [handler.name, methodName])
        return this
    }

    /**
     * Registers a route that responds to HTTP POST requests.
     *
     * @param path        The URL pattern to match (can include parameters, e.g., '/users').
     * @param definition  Either:
     *                      - An EventHandler function
     *                      - A tuple: [ControllerClass, methodName]
     * @param name        Optional route name (for URL generation or referencing).
     * @param middleware  Optional array of middleware functions to execute before the handler.
     */
    post (
        path: string,
        definition: RouteEventHandler | [(new (...args: any[]) => Record<string, any>), methodName: string],
        name?: string,
        middleware: IMiddleware[] = []
    ): Omit<this, RouterEnd> {
        const handler = Array.isArray(definition) ? definition[0] : definition
        const methodName = Array.isArray(definition) ? definition[1] : undefined

        this.addRoute('post', path, this.resolveControllerOrHandler(handler, methodName, path), name, middleware, [handler.name, methodName])
        return this
    }

    /**
     * Registers a route that responds to HTTP PUT requests.
     *
     * @param path        The URL pattern to match (can include parameters, e.g., '/users/:id').
     * @param definition  Either:
     *                      - An EventHandler function
     *                      - A tuple: [ControllerClass, methodName]
     * @param name        Optional route name (for URL generation or referencing).
     * @param middleware  Optional array of middleware functions to execute before the handler.
     */
    put (
        path: string,
        definition: RouteEventHandler | [(new (...args: any[]) => Record<string, any>), methodName: string],
        name?: string,
        middleware: IMiddleware[] = []
    ): Omit<this, RouterEnd> {
        const handler = Array.isArray(definition) ? definition[0] : definition
        const methodName = Array.isArray(definition) ? definition[1] : undefined
        this.addRoute('put', path, this.resolveControllerOrHandler(handler, methodName, path), name, middleware, [handler.name, methodName])
        return this
    }

    /**
     * Registers a route that responds to HTTP PATCH requests.
     *
     * @param path        The URL pattern to match (can include parameters, e.g., '/users/:id').
     * @param definition  Either:
     *                      - An EventHandler function
     *                      - A tuple: [ControllerClass, methodName]
     * @param name        Optional route name (for URL generation or referencing).
     * @param middleware  Optional array of middleware functions to execute before the handler.
     */
    patch (
        path: string,
        definition: RouteEventHandler | [(new (...args: any[]) => Record<string, any>), methodName: string],
        name?: string,
        middleware: IMiddleware[] = []
    ): Omit<this, RouterEnd> {
        const handler = Array.isArray(definition) ? definition[0] : definition
        const methodName = Array.isArray(definition) ? definition[1] : undefined
        this.addRoute('patch', path, this.resolveControllerOrHandler(handler, methodName, path), name, middleware, [handler.name, methodName])
        return this
    }

    /**
     * Registers a route that responds to HTTP DELETE requests.
     *
     * @param path        The URL pattern to match (can include parameters, e.g., '/users/:id').
     * @param definition  Either:
     *                      - An EventHandler function
     *                      - A tuple: [ControllerClass, methodName]
     * @param name        Optional route name (for URL generation or referencing).
     * @param middleware  Optional array of middleware functions to execute before the handler.
     */
    delete (
        path: string,
        definition: RouteEventHandler | [(new (...args: any[]) => Record<string, any>), methodName: string],
        name?: string,
        middleware: IMiddleware[] = []
    ): Omit<this, RouterEnd> {
        const handler = Array.isArray(definition) ? definition[0] : definition
        const methodName = Array.isArray(definition) ? definition[1] : undefined
        this.addRoute('delete', path, this.resolveControllerOrHandler(handler, methodName, path), name, middleware, [handler.name, methodName])
        return this
    }

    /**
     * API Resource support  
     * 
     * @param path 
     * @param controller 
     */
    apiResource (
        path: string,
        Controller: new (app: Application) => IController,
        middleware: IMiddleware[] = []
    ): Omit<this, RouterEnd | 'name'> {
        path = path.replace(/\//g, '/')

        const basePath = `/${path}`.replace(/\/+$/, '').replace(/(\/)+/g, '$1')
        const name = basePath.substring(basePath.lastIndexOf('/') + 1).replaceAll(/\/|:/g, '') || ''
        const param = singularize(name)

        this.get(basePath, [Controller, 'index'], `${name}.index`, middleware)
        this.post(basePath, [Controller, 'store'], `${name}.store`, middleware)
        this.get(`${basePath}/:${param}`, [Controller, 'show'], `${name}.show`, middleware)
        this.put(`${basePath}/:${param}`, [Controller, 'update'], `${name}.update`, middleware)
        this.patch(`${basePath}/:${param}`, [Controller, 'update'], `${name}.update`, middleware)
        this.delete(`${basePath}/:${param}`, [Controller, 'destroy'], `${name}.destroy`, middleware)

        return this
    }

    /**
     * Named route URL generator
     * 
     * @param name 
     * @param params 
     * @returns 
     */
    route (name: string, params: Record<string, string> = {}): string | undefined {
        const found = this.routes.find(r => r.name === name)
        if (!found) return undefined

        let url = found.path
        for (const [key, value] of Object.entries(params)) {
            url = url.replace(`:${key}`, value)
        }
        return url
    }

    /**
     * Grouping
     * 
     * @param options 
     * @param callback 
     */
    group (options: { prefix?: string; middleware?: EventHandler[] }, callback: (_e: this) => void) {
        const prevPrefix = this.groupPrefix
        const prevMiddleware = [...this.groupMiddleware]

        this.groupPrefix += options.prefix || ''
        this.groupMiddleware.push(...(options.middleware || []))

        callback(this)

        /**
         * Restore state after group
         */
        this.groupPrefix = prevPrefix
        this.groupMiddleware = prevMiddleware
        return this
    }

    /**
     * Set the name of the current route
     * 
     * @param name 
     */
    name (name: string) {
        this.nameMap.push(name)
        return this
    }

    /**
     * Registers middleware for a specific path.
     * @param path - The path to apply the middleware.
     * @param handler - The middleware handler.
     * @param opts - Optional middleware options.
     */
    middleware (path: string | IMiddleware[] | Middleware, handler: Middleware | MiddlewareOptions, opts?: MiddlewareOptions) {
        opts = typeof handler === 'object' ? handler : (typeof opts === 'function' ? opts : {})
        handler = typeof path === 'function' ? path : (typeof handler === 'function' ? handler : () => { })

        if (Array.isArray(path)) {
            this.middlewareMap.concat(path)
        } else if (typeof path === 'function') {
            this.h3App.use('/', () => { }).use(path)
        } else {
            this.h3App.use(path, handler, opts)
        }

        return this
    }
}
