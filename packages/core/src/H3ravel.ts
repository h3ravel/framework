import { Application, Kernel, OServiceProvider } from '.'
import { LogRequests, Request, Response } from '@h3ravel/http'

import { EntryConfig } from './Contracts/H3ravelContract'
import { H3 } from 'h3'
import { HttpContext } from '@h3ravel/shared'

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
    // Initialize the Application class
    const app = new Application(basePath)

    // Start up the app
    // @ts-expect-error Provider signature does not match since param is optional, but it should work
    await app.quickStartup(providers, config.filteredProviders, config.autoload)

    // Get the http app container binding
    const h3App = app.make('http.app')

    // Initialize the Application Kernel
    const kernel = new Kernel((event) => HttpContext.init({
        app,
        request: new Request(event, app),
        response: new Response(event, app)
    }), [new LogRequests()])

    // Register kernel with H3
    h3App.use((event) => kernel.handle(event, middleware))

    const originalFire = app.fire.bind(app)

    if (config.initialize) {
        // Fire up the server
        return await originalFire(h3App)
    }

    // Lazy init: redefine `fire` to call the original one later
    app.fire = () => originalFire(h3App)


    return app
}