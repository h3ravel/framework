import { CKernel, CallableConstructor, IApplication, IExceptionHandler, IKernel, MiddlewareList } from '@h3ravel/contracts'
import { ConsoleKernel, ExceptionHandler, Exceptions, Kernel, Middleware } from '..'

import { Route } from '@h3ravel/support/facades'
import { Collection, isClass, RouteServiceProvider } from '@h3ravel/support'
import { existsSync, statSync } from 'node:fs'
import { Command } from '@h3ravel/musket'

export class AppBuilder {

    /**
     * The Folio / page middleware that have been defined by the user.
     */
    protected pageMiddleware: MiddlewareList[] = []

    /**
     * Any additional routing callbacks that should be invoked while registering routes.
     */
    protected additionalRoutingCallbacks: CallableConstructor[] = []

    constructor(private app: IApplication) { }

    /**
     * Register the base kernel classes for the application.
     */
    withKernels () {
        this.app.singleton(IKernel, Kernel)

        this.app.singleton(CKernel, () => new ConsoleKernel(this.app))

        return this
    }

    /**
     * Register and wire up the application's exception handling layer.
     * 
     * @param using
     **/
    withExceptions (using: (exceptions: Exceptions) => void) {
        // Register the ExceptionHandler as a singleton
        this.app.singleton(IExceptionHandler, () => new ExceptionHandler())
        this.app.alias([
            [ExceptionHandler, IExceptionHandler],
            ['app.ExceptionHandler', IExceptionHandler]
        ])

        // Default to a no-op callback if none provided
        using ??= () => true

        // Hook into the lifecycle to initialize Exceptions once the handler is resolved
        this.app.afterResolving(IExceptionHandler, (handler) => {
            using(new Exceptions(handler))
        })

        return this
    }

    /**
     * Register and wire up the application's middleware handling layer.
     * 
     * @param using
     **/
    withMiddleware (callback?: (mw: Middleware) => void) {
        // After resolution, pass an instance of Middleware into the user callback
        this.app.afterResolving(IKernel, (kernel) => {
            const middleware = new Middleware(this.app)
                // TODO: Implement the route() method and use here
                .redirectGuestsTo(() => 'route(\'login\')')

            if (callback && typeof callback === 'function') {
                callback(middleware)
            }

            this.pageMiddleware = middleware.getPageMiddleware()
            kernel.setGlobalMiddleware(middleware.getGlobalMiddleware())
            kernel.setMiddlewareGroups(middleware.getMiddlewareGroups())
            kernel.setMiddlewareAliases(middleware.getMiddlewareAliases())

            const priorities = middleware.getMiddlewarePriority()
            if (priorities) {
                kernel.setMiddlewarePriority(priorities)
            }

            // const priorityAppends = middleware.getMiddlewarePriorityAppends()
            // if (priorityAppends) {
            //     for (const [newMiddleware, after] of Object.entries(priorityAppends)) {
            //         kernel.addToMiddlewarePriorityAfter(after, newMiddleware)
            //     }
            // }

            // const priorityPrepends = middleware.getMiddlewarePriorityPrepends()
            // if (priorityPrepends) {
            //     for (const [newMiddleware, before] of Object.entries(priorityAppends)) {
            //         kernel.addToMiddlewarePriorityBefore(before, newMiddleware)
            //     }
            // }
        })

        return this
    }

    /**
     * Register the routing services for the application.
     */
    withRouting ({ using, web, api, commands, health, channels, apiPrefix = 'api', then }: {
        using?: CallableConstructor;
        web?: string | string[];
        api?: string | string[];
        commands?: string | Collection<typeof Command<IApplication>>;
        health?: string;
        channels?: string;
        apiPrefix?: string;
        then?: CallableConstructor;
    } = {}) {
        if (
            using == null &&
            (typeof web === 'string' || Array.isArray(web) || typeof api === 'string' || Array.isArray(api) || typeof health === 'string') ||
            typeof api === 'function'
        ) {
            using = this.buildRoutingCallback({ web, api, health, apiPrefix, then })
            if (typeof health === 'string') {
                // TODO: Implement maintenance mode features
                // PreventRequestsDuringMaintenance.except(health)
            }
        }

        RouteServiceProvider.loadRoutesUsing(using)

        this.app.booting((app) => {
            app.registerProviders([RouteServiceProvider])
        })

        if (typeof commands === 'string' && existsSync(commands) !== false) {
            this.withCommands([commands])
        }

        if (typeof channels === 'string' && existsSync(channels) !== false) {
            // this.withBroadcasting(channels)
            // TODO: Implement broadcasting features
        }

        return this
    }

    /**
     * Create the routing callback for the application.
     *
     * @param  web
     * @param  api
     * @param  health
     * @param  apiPrefix
     * @param  then
     */
    protected buildRoutingCallback ({ web, api, health, apiPrefix, then }: {
        web?: string | string[];
        api?: string | string[];
        health?: string;
        apiPrefix: string;
        then?: CallableConstructor;
    }) {
        return () => {
            if (typeof api === 'string' || Array.isArray(api)) {
                if (Array.isArray(api)) {
                    for (const apiRoute of api) {
                        if (existsSync(apiRoute) !== false) {
                            Route.middleware('api').prefix(apiPrefix).group(apiRoute)
                        }
                    }
                } else {
                    Route.middleware('api').prefix(apiPrefix).group(api)
                }
            }

            if (typeof web === 'string' || Array.isArray(web)) {
                if (Array.isArray(web)) {
                    for (const webRoute of web) {
                        if (existsSync(webRoute) !== false) {
                            Route.middleware('web').group(webRoute)
                        }
                    }
                } else {
                    Route.middleware('web').group(web)
                }
            }

            for (const callback of this.additionalRoutingCallbacks) {
                callback()
            }

            if (then && typeof then === 'function') {
                then(this.app)
            }
        }
    }

    /**
     * Register additional Artisan commands with the application.
     *
     * @param  commands
     */
    withCommands (commands?: typeof Command<IApplication>[] | string[]) {
        let paths: any, routes: any
        if (!commands || commands.length < 1) {
            commands = [this.app.getPath('commands')]
        }

        this.app.afterResolving(CKernel, (kernel) => {
            [commands as any, paths] = (new Collection<typeof Command<IApplication>[] | string[]>(commands)).partition((command) => isClass(command));

            [routes, paths] = paths.partition((path: string) => statSync(path, { throwIfNoEntry: false })?.isFile())

            this.app.booted(() => {
                kernel.registerCommand((commands as any).all())
                kernel.addCommandPaths(paths.all())
                kernel.addCommandRoutePaths(routes.all())
            })
            // TODO: revist this to ensure everything works as expected
        })

        return this
    }

    /**
     * create
     */
    create () {

    }
}