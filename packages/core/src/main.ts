import 'reflect-metadata'

// import { Application, Kernel, LogRequests } from '@h3ravel/core'

// import type { H3 } from 'h3'

// async function bootstrap () {
//     const app = new Application(process.cwd())
//     await app.registerConfiguredProviders()
//     await app.boot()


//     const h3App = app.make<H3>('http.app')
//     const serve = app.make<typeof import('h3').serve>('http.serve')
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
