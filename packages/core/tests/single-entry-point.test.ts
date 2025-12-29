import { Application, ConfigException } from '@h3ravel/core'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { h3ravel } from '@h3ravel/core'

let app: Application

describe('Single Entry Point without @h3ravel/http installed', async () => {
    beforeEach(async () => {
        const { EventsServiceProvider } = await import(('@h3ravel/events'))
        const { RouteServiceProvider } = await import(('@h3ravel/router'))
        app = await h3ravel([EventsServiceProvider, RouteServiceProvider])
    })

    it('returns the fully configured Application instance', async () => {
        expect(app).toBeInstanceOf(Application)
    })

    it('will throw ConfigException when an H3 app instance is not provided and fire() is called', async () => {
        await expect(app.fire()).rejects.toThrowError(new ConfigException('[Provide a H3 app instance in the config or install @h3ravel/http]'))
    })
})

describe('Single Entry Point with @h3ravel/http installed', async () => {
    beforeEach(async () => {
        const { HttpServiceProvider } = await import(('@h3ravel/http'))
        const { RouteServiceProvider } = await import(('@h3ravel/router'))
        app = await h3ravel([HttpServiceProvider, RouteServiceProvider])
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