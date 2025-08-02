import 'reflect-metadata'

import { config as loadEnv } from 'dotenv'

loadEnv()

// import { Application, Kernel, LogRequests } from '@h3ravel/core'

// import type { H3 } from 'h3'

// async function bootstrap () {
//     const app = new Application(process.cwd())
//     await app.registerConfiguredProviders()
//     await app.boot()


//     const h3App = app.make('http.app')
//     const serve = app.make('http.serve')
//     const kernel = new Kernel([new LogRequests()])

//     // Wrap all routes
//     h3App.use(async (event) => {
//         return kernel.handle(event, async () => {
//             // If middleware passes, H3 continues to normal routing
//             return undefined
//         })
//     })

//     serve(h3App, { port: 3000 })
// }
// bootstrap()
