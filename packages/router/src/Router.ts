import { EventHandler, Middleware, MiddlewareOptions, RouteOptions, type H3 } from 'h3'
import type { Controller } from '@h3ravel/core'

type Handler = EventHandler

export class Router {
    constructor(private app: H3) { }

    private resolveHandler (
        controller: Controller,
        method: keyof Controller
    ): Handler {
        return (event) => {
            const handler = controller[method]
            if (typeof handler !== 'function') {
                throw new Error(`Method ${String(method)} not found on controller`)
            }
            return handler.call(controller, event)
        }
    }

    get (path: string, handler: Handler | [Controller, keyof Controller], opts?: RouteOptions) {
        if (Array.isArray(handler)) {
            const [controller, method] = handler
            this.app.get(path, this.resolveHandler(controller, method), opts)
        } else {
            this.app.get(path, handler, opts)
        }
    }

    post (path: string, handler: Handler | [Controller, keyof Controller], opts?: RouteOptions) {
        if (Array.isArray(handler)) {
            const [controller, method] = handler
            this.app.post(path, this.resolveHandler(controller, method), opts)
        } else {
            this.app.post(path, handler, opts)
        }
    }

    put (path: string, handler: Handler | [Controller, keyof Controller], opts?: RouteOptions) {
        if (Array.isArray(handler)) {
            const [controller, method] = handler
            this.app.put(path, this.resolveHandler(controller, method), opts)
        } else {
            this.app.put(path, handler, opts)
        }
    }

    delete (path: string, handler: Handler | [Controller, keyof Controller], opts?: RouteOptions) {
        if (Array.isArray(handler)) {
            const [controller, method] = handler
            this.app.delete(path, this.resolveHandler(controller, method), opts)
        } else {
            this.app.delete(path, handler, opts)
        }
    }

    patch (path: string, handler: Handler | [Controller, keyof Controller], opts?: RouteOptions) {
        if (Array.isArray(handler)) {
            const [controller, method] = handler
            this.app.patch(path, this.resolveHandler(controller, method), opts)
        } else {
            this.app.patch(path, handler, opts)
        }
    }

    apiResource (path: string, controller: Controller, opts?: RouteOptions) {
        this.get(path, [controller, 'index'])
        this.post(path, [controller, 'store'])
        this.get(`${path}/:id`, [controller, 'show'])
        this.put(`${path}/:id`, [controller, 'update'])
        this.delete(`${path}/:id`, [controller, 'destroy'])
    }

    middleware (path: string, handler: Middleware, opts?: MiddlewareOptions) {
        this.app.use(path, handler, opts)
    }
}
