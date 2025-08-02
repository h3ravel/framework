import { H3Event, Middleware, MiddlewareOptions, type H3 } from 'h3'
import { Application, Controller, Kernel } from '@h3ravel/core'
import { Middleware as HttpMiddleware } from '@h3ravel/http'
import { HttpContext } from '@h3ravel/http'
import { afterLast } from '@h3ravel/support'

type EventHandler = (ctx: HttpContext) => unknown

interface RouteDefinition {
    method: string
    path: string
    name?: string
    handler: EventHandler
}

export class Router {
    private routes: RouteDefinition[] = []
    private groupPrefix = ''
    private groupMiddleware: EventHandler[] = []

    constructor(private h3App: H3, private app: Application) { }

    /**
     * Route Resolver
     * 
     * @param handler 
     * @param middleware 
     * @returns 
     */
    private resolveHandler (handler: EventHandler, middleware: HttpMiddleware[] = []) {
        return async (event: H3Event) => {
            const kernel = new Kernel(middleware)
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
        middleware: HttpMiddleware[] = []
    ) {
        const fullPath = `${this.groupPrefix}${path}`.replace(/\/+/g, '/')
        this.routes.push({ method, path: fullPath, name, handler })
        this.h3App[method as 'get'](fullPath, this.resolveHandler(handler, middleware))
    }

    private resolveControllerOrHandler (
        handler: EventHandler | (new (...args: any[]) => Controller),
        methodName?: string
    ): EventHandler {
        if (typeof handler === 'function' && (handler as any).prototype instanceof Controller) {
            return (ctx) => {
                const controller = new (handler as new (...args: any[]) => Controller)(this.app)
                const action = (methodName || 'index') as keyof Controller

                if (typeof controller[action] !== 'function') {
                    throw new Error(`Method "${action}" not found on controller ${handler.name}`)
                }

                return controller[action](ctx)
            }
        }

        return handler as EventHandler
    }


    get (
        path: string,
        handler: EventHandler | (new (...args: any[]) => Controller),
        methodName?: string, name?: string, middleware: HttpMiddleware[] = []
    ) {
        this.addRoute('get', path, this.resolveControllerOrHandler(handler, methodName), name, middleware)
    }

    post (
        path: string,
        handler: EventHandler | (new (...args: any[]) => Controller),
        methodName?: string, name?: string, middleware: HttpMiddleware[] = []
    ) {
        this.addRoute('post', path, this.resolveControllerOrHandler(handler, methodName), name, middleware)
    }

    put (
        path: string,
        handler: EventHandler | (new (...args: any[]) => Controller),
        methodName?: string, name?: string, middleware: HttpMiddleware[] = []
    ) {
        this.addRoute('put', path, this.resolveControllerOrHandler(handler, methodName), name, middleware)
    }

    delete (
        path: string,
        handler: EventHandler | (new (...args: any[]) => Controller),
        methodName?: string, name?: string, middleware: HttpMiddleware[] = []
    ) {
        this.addRoute('delete', path, this.resolveControllerOrHandler(handler, methodName), name, middleware)
    }

    /**
     * API Resource support  
     * 
     * @param path 
     * @param controller 
     */
    apiResource (
        path: string,
        Controller: new (app: Application) => Controller,
        middleware: HttpMiddleware[] = []
    ) {
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
    }

    middleware (path: string, handler: Middleware, opts?: MiddlewareOptions) {
        this.h3App.use(path, handler, opts)
    }
}
