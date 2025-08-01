import { H3Event, Middleware, MiddlewareOptions, type H3 } from 'h3'
import { Controller, Kernel } from '@h3ravel/core'
import { Middleware as HttpMiddleware } from '@h3ravel/http'
import { HttpContext } from '@h3ravel/http'
import { singularize } from '@h3ravel/support'

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

    constructor(private app: H3) { }

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
        this.app[method as 'get'](fullPath, this.resolveHandler(handler, middleware))
    }

    get (path: string, handler: EventHandler, name?: string, middleware: HttpMiddleware[] = []) {
        this.addRoute('get', path, handler, name, middleware)
    }

    post (path: string, handler: EventHandler, name?: string, middleware: HttpMiddleware[] = []) {
        this.addRoute('post', path, handler, name, middleware)
    }

    put (path: string, handler: EventHandler, name?: string, middleware: HttpMiddleware[] = []) {
        this.addRoute('put', path, handler, name, middleware)
    }

    delete (path: string, handler: EventHandler, name?: string, middleware: HttpMiddleware[] = []) {
        this.addRoute('delete', path, handler, name, middleware)
    }

    /**
     * API Resource support  
     * 
     * @param path 
     * @param controller 
     */
    apiResource (
        path: string,
        controller: Controller,
        middleware: HttpMiddleware[] = []
    ) {
        path = path.replace(/\//g, '/')

        const basePath = `/${path}`.replace(/\/+/g, '/')
        console.log(`${basePath}/:id`, singularize(path), basePath)

        this.addRoute('get', basePath, controller.index, `${path}.index`, middleware)
        this.addRoute('post', basePath, controller.store, `${path}.store`, middleware)
        this.addRoute('get', `${basePath}/:id`, controller.show, `${path}.show`, middleware)
        this.addRoute('put', `${basePath}/:id`, controller.update, `${path}.update`, middleware)
        this.addRoute('delete', `${basePath}/:id`, controller.destroy, `${path}.destroy`, middleware)
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
        this.app.use(path, handler, opts)
    }
}
