import { beforeEach, describe, it } from 'vitest'

import { IApplication } from '@h3ravel/contracts'
import { h3ravel } from '@h3ravel/core'

let app: IApplication

class Cont {
    index () { }
    show () { }
}

// function makeEvent (overides: Record<string, any> = {}) {
//     globalThis.dump = () => { }
//     return {
//         res: { headers: new Headers(), statusCode: 200 },
//         req: { headers: new Headers(), url: overides.url ?? 'http://localhost/test', method: 'get' },
//     } as any
// }

describe('Router', async () => {
    beforeEach(async () => {
        const { EventsServiceProvider } = await import(('@h3ravel/events'))
        const { HttpServiceProvider } = await import(('@h3ravel/http'))
        const { RouteServiceProvider } = await import(('@h3ravel/router'))
        app = await h3ravel([EventsServiceProvider, HttpServiceProvider, RouteServiceProvider])
    })

    it('can load routes before server is fired', async () => {
        const router = app.make('router')

        router.match(['GET'], 'path/{user}/{name}', [Cont, 'index']).name('path')
        router.match(['GET'], 'path3/{user:name}/{name}', [Cont, 'show']).name('path.3').prefix('---john')
        router.match(['PUT'], 'path4/{user}/{name?}', () => { }).name('path.4')
        router.match(['POST'], 'path5/{user:name}/{name}', () => { })

        router.getRoutes().refreshActionLookups()
        router.getRoutes().refreshNameLookups()
    })
})