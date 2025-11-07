import { Application, ConfigException, Kernel, OServiceProvider } from '.'
import { HttpContext, LogRequests, Request, Response } from '@h3ravel/http'

import { EntryConfig } from './Contracts/H3ravelContract'
import { H3 } from 'h3'

/**
 * Simple global entry point for H3ravel applications
 * 
 * @param providers 
 * @param basePath 
 * @param callback 
 */
export const h3ravel = async (
    /**
     * List of intial service providers to register with your app
     */
    providers: Exclude<OServiceProvider, 'app' | 'commands'>[] = [],
    /**
     * Entry path of your app
     */
    basePath = process.cwd(),
    /**
     * Configuration option to pass to the initializer
     */
    config: EntryConfig = { initialize: false, autoload: false, filteredProviders: [] },
    /**
     * final middleware function to call once the server is fired up
     */
    middleware: (ctx: HttpContext) => Promise<unknown> = async () => undefined,
): Promise<Application> => {
    // Initialize the H3 app instance
    let h3App: H3 | undefined

    // Initialize the Application class
    const app = new Application(basePath)

    // Start up the app
    // @ts-expect-error Provider signature does not match since param is optional, but it should work
    await app.quickStartup(providers, config.filteredProviders, config.autoload)

    try {
        // Get the http app container binding
        h3App = app.make('http.app')

        // Define app context factory
        app.context = async (event) => {
            // If we’ve already attached the context to this event, reuse it
            if ((event as any)._h3ravelContext)
                return (event as any)._h3ravelContext

            Request.enableHttpMethodParameterOverride()
            const ctx = HttpContext.init({
                app,
                request: await Request.create(event, app),
                response: new Response(event, app),
            });

            (event as any)._h3ravelContext = ctx
            return ctx
        }

        // Initialize the Application Kernel
        const kernel = new Kernel(async (event) => app.context!(event), [new LogRequests()])

        // Register kernel with H3
        h3App.use((event) => kernel.handle(event, middleware))
    } catch {
        if (!h3App && config.h3) {
            h3App = config.h3
        }
    }

    const originalFire = app.fire

    const proxyThis = (function makeProxy (appRef, orig) {
        return new Proxy(appRef, {
            get (target, prop, receiver) {
                if (prop === 'fire') return orig
                // preserve correct behavior for symbols / inspect / prototype lookups
                return Reflect.get(target, prop, receiver)
            },
            has (target, prop) {
                if (prop === 'fire') return true
                return Reflect.has(target, prop)
            },
            getOwnPropertyDescriptor (target, prop) {
                if (prop === 'fire') {
                    return {
                        configurable: true,
                        enumerable: false,
                        writable: true,
                        value: orig,
                    }
                }
                return Reflect.getOwnPropertyDescriptor(target, prop as PropertyKey)
            }
        })
    })(app, originalFire)

    if (config.initialize && h3App) {
        // Fire up the server
        return await Reflect.apply(originalFire, app, [h3App])
    }

    app.fire = function () {
        if (!h3App) {
            throw new ConfigException('Provide a H3 app instance in the config or install @h3ravel/http')
        }

        // call original with proxyThis as `this` so internal `this.fire()` resolves to originalFire
        return Reflect.apply(originalFire, proxyThis, [h3App])
    }

    return app
}