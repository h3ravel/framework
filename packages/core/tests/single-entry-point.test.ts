import { Application, ConfigException } from '@h3ravel/core'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { FileSystem } from '@h3ravel/shared'
import { h3ravel } from '@h3ravel/core'

let app: Application
let HttpProvider: any
let RouteProvider: any
const httpPath = FileSystem.findModulePkg('@h3ravel/http', process.cwd()) ?? ''
const routePath = FileSystem.findModulePkg('@h3ravel/router', process.cwd()) ?? ''

console.log = vi.fn(() => 0)

describe('Single Entry Point without @h3ravel/http installed', async () => {
    beforeEach(async () => {
        RouteProvider = (await import(routePath)).RouteServiceProvider
        app = await h3ravel([RouteProvider])
    })

    it('returns the fully configured Application instance', async () => {
        expect(app).toBeInstanceOf(Application)
    })

    it('will throw ConfigException when an H3 app instance is not provided and fire() is called', async () => {
        expect(app.fire).toThrow(new ConfigException('Provide a H3 app instance in the config or install @h3ravel/http'))
    })
})

describe('Single Entry Point with @h3ravel/http installed', async () => {
    beforeEach(async () => {
        HttpProvider = (await import(httpPath)).HttpServiceProvider
        RouteProvider = (await import(routePath)).RouteServiceProvider
        app = await h3ravel([HttpProvider, RouteProvider])
    })

    it('returns the fully configured Application instance', async () => {
        expect(app).toBeInstanceOf(Application)
    })

    it('can load routes before server is fired', () => {
        app.make('router').get('path', () => ({ success: true }), 'path')
        expect(app.bindings.get('app.routes')?.()).toMatchObject([{ name: 'path' }])
        expect(app.bindings.get('app.routes')?.()).toMatchObject([{ path: 'path' }])
        expect(app.bindings.get('app.routes')?.()).toMatchObject([{ method: 'get' }])
    })
})