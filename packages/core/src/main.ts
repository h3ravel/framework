import 'reflect-metadata'

import { Application } from './Application'
import { H3, type serve as H3Serve } from 'h3'

/**
 * Boostrap the app
 */
async function bootstrap () {
    const app = new Application(process.cwd())
    await app.registerConfiguredProviders()
    await app.boot()

    const h3App = app.make<H3>('http.app')
    const serve = app.make<typeof H3Serve>('http.serve')

    // h3App

    // Example route
    h3App.get('/', (event) => {
        if (!event.res.headers.has('Content-Type')) {
            event.res.headers.set('Content-Type', 'text/plain; charset=utf-8')
        }

        return '⚡️ Tadaas!'
    })

    serve(h3App, { port: 3000 })
    console.log('🚀 H3ravel running on http://localhost:3000')
}

bootstrap()
