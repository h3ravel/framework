import { Application, Kernel, OServiceProvider } from '.'
import { IApplication, IHttpContext } from '@h3ravel/contracts'

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
    middleware: (ctx: IHttpContext) => Promise<unknown> = async () => undefined,
): Promise<Application> => {

    const { FlashDataMiddleware, HttpContext, LogRequests, Request, Response } = await import('@h3ravel/http')

    // Initialize the H3 app instance
    let h3App: H3 | undefined

    // Initialize the Application class
    const app = new Application(basePath)

    // Overide defined paths
    if (config.customPaths) {
        for (const [name, path] of Object.entries(config.customPaths)) {
            app.setPath(name as never, path)
        }
    }

    // Start up the app
    // @ts-expect-error Provider signature does not match since param is optional, but it should work
    await app.quickStartup(providers, config.filteredProviders, config.autoload)

    try {
        // Get the http app container binding
        h3App = app.make('http.app')
        app.setH3App(h3App)

        // Define app context factory
        app.context = async (event) => {
            event = config.h3Event ?? event

            // If we’ve already attached the context to this event, reuse it
            if ((event as any)._h3ravelContext)
                return (event as any)._h3ravelContext

            Request.enableHttpMethodParameterOverride()
            const ctx = HttpContext.init({
                app,
                request: await Request.create(event, app),
                response: new Response(app, event),
            }, event);

            (event as any)._h3ravelContext = ctx
            return ctx
        }

        app.singleton(IApplication, () => app)
        app.singleton('app.globalMiddleware', () => [
            LogRequests,
            FlashDataMiddleware
        ].map(e => app.make(e)))

        // Initialize the Application Kernel
        // const kernel = new Kernel(app)
        // // Register kernel with H3
        // h3App.use(async (event) => {
        //     const resp = await kernel.handle(event, middleware)
        //     console.log(resp)
        //     return resp
        // })
        await app.handleRequest()
        void middleware
    } catch {
        if (!h3App && config.h3) {
            h3App = config.h3
        }
    }

    // Fire up the dev server
    if (config.initialize && h3App) {
        return await app.fire(h3App)
    }

    return app.setH3App(h3App)
}