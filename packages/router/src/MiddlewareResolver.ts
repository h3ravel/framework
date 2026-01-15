import { IApplication, MiddlewareIdentifier, MiddlewareList } from '@h3ravel/contracts'

type MiddlewareMap = Record<string, MiddlewareIdentifier>
type MiddlewareGroups = Record<string, MiddlewareIdentifier[]>

export class MiddlewareResolver {
    static app: IApplication

    static setApp (app: IApplication) {
        this.app = app
        return this
    }

    /**
     * Resolve the middleware name to a class name(s) preserving passed parameters.
     */
    static resolve (
        name: MiddlewareIdentifier,
        map: MiddlewareMap,
        middlewareGroups: MiddlewareGroups
    ): MiddlewareIdentifier | MiddlewareList {
        /**
         * Inline middleware (closure)
         */
        if (typeof name !== 'string') {
            return name
        }

        /**
         * Mapped closure
         */
        if (map[name] && typeof map[name] === 'function') {
            return map[name]
        }

        /**
         * Middleware group
         */
        if (middlewareGroups[name]) {
            return this.parseMiddlewareGroup(name, map, middlewareGroups)
        }

        /**
         * Parse name + parameters
         */
        const [base, parameters] = name.split(':', 2)

        const resolved = map[base] ?? base

        return parameters ? `${resolved}:${parameters}` : resolved
    }

    /**
     * Parse the middleware group and format it for usage.
     */
    protected static parseMiddlewareGroup (
        name: string,
        map: MiddlewareMap,
        middlewareGroups: MiddlewareGroups
    ): MiddlewareList {
        const results: MiddlewareList = []

        for (const middleware of middlewareGroups[name]) {
            /**
             * Nested group
             */
            if (typeof middleware === 'string' && middlewareGroups[middleware]) {
                results.push(...this.parseMiddlewareGroup(middleware, map, middlewareGroups))
                continue
            }

            let resolved: MiddlewareIdentifier = ''
            let parameters: string = ''

            if (typeof middleware === 'string') {
                const base = middleware.split(':', 2)[0]
                parameters = middleware.split(':', 2)[1]

                resolved = map[base] ?? base

                results.push(parameters ? `${String(resolved)}:${parameters}` : String(resolved))
                const bound = this.app.boundMiddlewares(resolved)
                if (bound) results.push(bound)
            } else {
                const bound = this.app.boundMiddlewares(middleware)
                if (bound) results.push(bound)
            }
        }

        return results.filter(e => typeof e !== 'string')
    }
}
