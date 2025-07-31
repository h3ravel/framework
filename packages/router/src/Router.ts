import { EventHandler, Middleware, MiddlewareOptions, type H3 } from 'h3'
import { Kernel, type Middleware as HttpMiddleware } from '@h3ravel/core'

type Handler = EventHandler

interface RouteDefinition {
    method: string
    path: string
    name?: string
    handler: Handler
}

export class Router {
    private routes: RouteDefinition[] = []
    private groupPrefix = ''
    private groupMiddleware: Handler[] = []

    constructor(private app: H3) { }

    /**
     * Route Resolver
     * 
     * @param handler 
     * @returns 
     */
    private resolveHandler (handler: Handler): Handler {
        return async (event) => {
            /**
             * Apply group middleware
             */
            for (const mw of this.groupMiddleware) {
                await mw(event)
            }
            return handler(event)
        }
    }

    /**
     * Add a route to the stack
     * 
     * @param method 
     * @param path 
     * @param handler 
     * @param name 
     */
    private addRoute (method: string, path: string, handler: Handler, name?: string) {
        const fullPath = `${this.groupPrefix}${path}`
        this.routes.push({ method, path: fullPath, name, handler })
        this.app[method as 'get'](fullPath, this.resolveHandler(handler))
    }

    get (path: string, handler: Handler, name?: string, middleware: HttpMiddleware[] = []) {
        // this.addRoute('get', path, handler, name)
        this.addRoute('get', path, async (event) => {
            const kernel = new Kernel(middleware)
            return kernel.handle(event, () => Promise.resolve(handler(event)))
        }, name)
    }

    post (path: string, handler: Handler, name?: string, middleware: HttpMiddleware[] = []) {
        // this.addRoute('post', path, handler, name)
        this.addRoute('post', path, async (event) => {
            const kernel = new Kernel(middleware)
            return kernel.handle(event, () => Promise.resolve(handler(event)))
        }, name)
    }

    put (path: string, handler: Handler, name?: string, middleware: HttpMiddleware[] = []) {
        // this.addRoute('put', path, handler, name)
        this.addRoute('put', path, async (event) => {
            const kernel = new Kernel(middleware)
            return kernel.handle(event, () => Promise.resolve(handler(event)))
        }, name)
    }

    delete (path: string, handler: Handler, name?: string, middleware: HttpMiddleware[] = []) {
        // this.addRoute('delete', path, handler, name)
        this.addRoute('put', path, async (event) => {
            const kernel = new Kernel(middleware)
            return kernel.handle(event, () => Promise.resolve(handler(event)))
        }, name)
    }

    /**
     * API Resource support  
     * 
     * @param path 
     * @param controller 
     */
    apiResource (path: string, controller: any, middleware: HttpMiddleware[] = []) {
        this.get(
            path,
            this.resolveHandler(controller.index.bind(controller)),
            `${path}.index`, middleware
        )

        this.post(
            path,
            this.resolveHandler(controller.store.bind(controller)),
            `${path}.store`,
            middleware
        )

        this.get(
            `${path}/:id`,
            this.resolveHandler(controller.show.bind(controller)),
            `${path}.show`,
            middleware
        )

        this.put(
            `${path}/:id`,
            this.resolveHandler(controller.update.bind(controller)),
            `${path}.update`,
            middleware
        )

        this.delete(
            `${path}/:id`,
            this.resolveHandler(controller.destroy.bind(controller)),
            `${path}.destroy`,
            middleware
        )

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
    group (options: { prefix?: string; middleware?: Handler[] }, callback: () => void) {
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
