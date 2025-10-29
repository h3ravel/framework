import { beforeAll, describe, expect, it } from 'vitest'

import { Application } from '@h3ravel/core'
import { FileSystem } from '@h3ravel/shared'
import { h3ravel } from '@h3ravel/core'

let app: Application
let HttpProvider: any
let RouteProvider: any
const httpPath = FileSystem.findModulePkg('@h3ravel/http', process.cwd()) ?? ''
const routePath = FileSystem.findModulePkg('@h3ravel/router', process.cwd()) ?? ''

beforeAll(async () => {
    HttpProvider = (await import(httpPath)).HttpServiceProvider
    RouteProvider = (await import(routePath)).RouteServiceProvider
    app = await h3ravel([HttpProvider, RouteProvider])
})

describe('Single Entry Point', async () => {
    it('can initialize app using single entry point', async () => {
        expect(app).toBeInstanceOf(Application)
    })

    it('can load routes before server is fired', () => {
        app.make('router').get('path', () => ({ success: true }), 'path')
        expect(app.bindings.get('app.routes')?.()).toMatchObject([{ name: 'path' }])
        expect(app.bindings.get('app.routes')?.()).toMatchObject([{ path: 'path' }])
        expect(app.bindings.get('app.routes')?.()).toMatchObject([{ method: 'get' }])
    })
}) 
