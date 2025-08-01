import 'reflect-metadata'

import { Application } from '@h3ravel/core'
import type { H3 } from 'h3'
import { Kernel } from '@h3ravel/core'
import { LogRequests } from '@h3ravel/http'

async function bootstrap () {
    const app = new Application(process.cwd())

    app.registerProviders([
        (await import('@h3ravel/cache')).CacheServiceProvider,
        (await import('@h3ravel/queue')).QueueServiceProvider,
        (await import('@h3ravel/mail')).MailServiceProvider
    ])

    await app.registerConfiguredProviders()
    await app.boot()

    const h3App = app.make<H3>('http.app')
    const serve = app.make<typeof import('h3').serve>('http.serve')

    const kernel = new Kernel([new LogRequests()])

    h3App.use((event) => kernel.handle(event, async () => undefined))

    serve(h3App, { port: 3000 })
    console.log('🚀 H3ravel Boilerplate running at http://localhost:3000')
}

bootstrap()
