import { beforeEach, describe, expect, it } from 'vitest'

import { Application } from '@h3ravel/core'
import { ConfigException } from '@h3ravel/foundation'
import { h3ravel } from '@h3ravel/core'
import path from 'node:path'

let app: Application

describe('Single Entry Point without @h3ravel/http installed', async () => {
    beforeEach(() => {
        app = new Application(process.cwd())
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
        const { ConfigServiceProvider } = await import('@h3ravel/config')
        const { HttpServiceProvider } = await import(('@h3ravel/http'))
        const { RouteServiceProvider } = await import('@h3ravel/support')
        app = await h3ravel(
            [ConfigServiceProvider, HttpServiceProvider, RouteServiceProvider],
            path.join(process.cwd(), 'packages/core/tests'),
            {
                autoload: false,
                customPaths: {
                    config: '../../session/tests/config',
                }
            }
        )
        await app.boot()
    })

    it('returns the fully configured Application instance', async () => {
        expect(app).toBeInstanceOf(Application)
    })

    it('can load routes before server is fired', () => {
        const router = app.make('router')
        router.get('path', () => ({ success: true })).name('path')
        router.getRoutes().refreshNameLookups()

        const route = router.getRoutes().getByName('path')
        expect(route?.getName()).toBe('path')
        expect(route?.uri()).toBe('path')
    })
})
