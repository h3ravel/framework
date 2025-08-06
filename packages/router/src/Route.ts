import { H3Event, Middleware, MiddlewareOptions, type H3 } from 'h3'
import { Request, Response } from '@h3ravel/http'
import { Application, Controller, Kernel } from '@h3ravel/core'
import { afterLast } from '@h3ravel/support'
import type { EventHandler, IController, IMiddleware, IRouter, RouterEnd } from '@h3ravel/shared'

interface RouteDefinition {
    method: string
    path: string
    name?: string
    handler: EventHandler
}

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
            const kernel = new Kernel(() => ({
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
        method: string,
        path: string,
        handler: EventHandler,
        name?: string,
        middleware: IMiddleware[] = []
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
        this.routes.push({ method, path: fullPath, name, handler })
        this.h3App[method as 'get'](fullPath, this.resolveHandler(handler, middleware))
    }

    private resolveControllerOrHandler (
        handler: EventHandler | (new (...args: any[]) => IController),
        methodName?: string
    ): EventHandler {
        if (typeof handler === 'function' && (handler as any).prototype instanceof Controller) {
            return (ctx) => {
                const controller = new (handler as new (...args: any[]) => IController)(this.app)
                const action = (methodName || 'index') as keyof IController

                if (typeof controller[action] !== 'function') {
                    throw new Error(`Method "${String(action)}" not found on controller ${handler.name}`)
                }

                return controller[action](ctx)
            }
        }

        return handler as EventHandler
    }


    get (
        path: string,
        definition: EventHandler | [(new (...args: any[]) => IController), methodName: string],
        name?: string,
        middleware: IMiddleware[] = []
    ): Omit<this, RouterEnd> {
        const handler = Array.isArray(definition) ? definition[0] : definition
        const methodName = Array.isArray(definition) ? definition[1] : undefined
        this.addRoute('get', path, this.resolveControllerOrHandler(handler, methodName), name, middleware)
        return this
    }

    post (
        path: string,
        definition: EventHandler | [(new (...args: any[]) => IController), methodName: string],
        name?: string,
        middleware: IMiddleware[] = []
    ): Omit<this, RouterEnd> {
        const handler = Array.isArray(definition) ? definition[0] : definition
        const methodName = Array.isArray(definition) ? definition[1] : undefined
        this.addRoute('post', path, this.resolveControllerOrHandler(handler, methodName), name, middleware)
        return this
    }

    put (
        path: string,
        definition: EventHandler | [(new (...args: any[]) => IController), methodName: string],
        name?: string,
        middleware: IMiddleware[] = []
    ): Omit<this, RouterEnd> {
        const handler = Array.isArray(definition) ? definition[0] : definition
        const methodName = Array.isArray(definition) ? definition[1] : undefined
        this.addRoute('put', path, this.resolveControllerOrHandler(handler, methodName), name, middleware)
        return this
    }

    delete (
        path: string,
        definition: EventHandler | [(new (...args: any[]) => IController), methodName: string],
        name?: string,
        middleware: IMiddleware[] = []
    ): Omit<this, RouterEnd> {
        const handler = Array.isArray(definition) ? definition[0] : definition
        const methodName = Array.isArray(definition) ? definition[1] : undefined
        this.addRoute('delete', path, this.resolveControllerOrHandler(handler, methodName), name, middleware)
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

        const name = afterLast(path, '/')
        const basePath = `/${path}`.replace(/\/+/g, '/')

        const controller = new Controller(this.app)

        this.addRoute('get', basePath, controller.index.bind(controller), `${name}.index`, middleware)
        this.addRoute('post', basePath, controller.store.bind(controller), `${name}.store`, middleware)
        this.addRoute('get', `${basePath}/:id`, controller.show.bind(controller), `${name}.show`, middleware)
        this.addRoute('put', `${basePath}/:id`, controller.update.bind(controller), `${name}.update`, middleware)
        this.addRoute('patch', `${basePath}/:id`, controller.update.bind(controller), `${name}.update`, middleware)
        this.addRoute('delete', `${basePath}/:id`, controller.destroy.bind(controller), `${name}.destroy`, middleware)
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
    group (options: { prefix?: string; middleware?: EventHandler[] }, callback: () => void) {
        const prevPrefix = this.groupPrefix
        const prevMiddleware = [...this.groupMiddleware]

        this.groupPrefix += options.prefix || ''
        this.groupMiddleware.push(...(options.middleware || []))

        callback()

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
    middleware (path: string | IMiddleware[], handler: Middleware, opts?: MiddlewareOptions) {
        if (typeof path === 'string') {
            this.h3App.use(path, handler, opts)
        } else {
            this.middlewareMap.concat(path)
        }
        return this
    }
}
