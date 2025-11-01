import { Application, h3ravel } from '@h3ravel/core'
import { RequestAwareHelpers, UrlServiceProvider } from '../src'
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import { EnvLoader } from '@h3ravel/config'
import { HttpServiceProvider } from '@h3ravel/http'
import { RouteServiceProvider } from '@h3ravel/router'
import { Url } from '../src/Url'

console.log = vi.fn(() => 0)

const globalThat = {
    config: vi.fn((key: string) => {
        if (key === 'app.url') return 'https://example.com'
        if (key === 'app.key') return 'test-secret-key'
        return null
    }),
}

Object.assign(globalThis, globalThat)

describe('Url', () => {
    // Mock Application for testing
    let app: Application
    const mockApp = {
        config: {
            get: vi.fn((key: string) => {
                if (key === 'app.url') return 'https://example.com'
                if (key === 'app.key') return 'test-secret-key'
                if (key === 'app.routes') return []
                return null
            })
        },
        bindings: { config: {} },
        make: vi.fn()
    }

    class ExampleController {
        public async index () {
            return { success: true }
        }
    }


    beforeAll(async () => {

        globalThis.env = new EnvLoader().get
        app = await h3ravel([HttpServiceProvider, RouteServiceProvider, UrlServiceProvider], process.cwd())
        Object.assign(mockApp, app)
        Object.assign(globalThis, globalThat)
        app.make('router').get('path', () => ({ success: true }), 'path')
        app.make('router').get('path/index', [ExampleController, 'index'], 'path.index')
        app.fire()
    })

    beforeEach(() => {
        vi.clearAllMocks()
    })

    describe('Static Factories', () => {
        it('should create URL from string', () => {
            const url = Url.of('https://example.com/path?param=value#section')

            expect(url.getScheme()).toBe('https')
            expect(url.getHost()).toBe('example.com')
            expect(url.getPath()).toBe('/path')
            expect(url.getQuery()).toEqual({ param: 'value' })
            expect(url.getFragment()).toBe('section')
        })

        it('should create URL from path', () => {
            const url = Url.to('/users', mockApp as any)

            expect(url.getScheme()).toBe('https')
            expect(url.getHost()).toBe('example.com')
            expect(url.getPath()).toBe('/users')
        })

        it('should throw error for invalid URL string', () => {
            expect(() => Url.of('invalid-url')).toThrow('Invalid URL: invalid-url')
        })

        it('should create URL from route', () => {
            const mockRouter = {
                route: vi.fn().mockReturnValue('/users/123')
            }
            mockApp.make.mockReturnValue(mockRouter)

            const url = Url.route('users.show', { id: 123 }, mockApp as any)

            expect(mockRouter.route).toHaveBeenCalledWith('users.show', { id: 123 })
            expect(url.getPath()).toBe('/users/123')
        })

        it('should throw error when route not found', () => {
            const mockRouter = {
                route: vi.fn().mockReturnValue(undefined)
            }
            mockApp.make.mockReturnValue(mockRouter)

            expect(() => Url.route('nonexistent.route', {}, mockApp as any))
                .toThrow('Route "nonexistent.route" not found')
        })

        it('should create signed route URL', () => {
            const mockRouter = {
                route: vi.fn().mockReturnValue('/users/123')
            }
            mockApp.make.mockReturnValue(mockRouter)

            const url = Url.signedRoute('users.show', { id: 123 }, mockApp as any)

            expect(url.getQuery()).toHaveProperty('signature')
        })

        it('should create temporary signed route URL', () => {
            const mockRouter = {
                route: vi.fn().mockReturnValue('/users')
            }
            mockApp.make.mockReturnValue(mockRouter)

            const expiration = Date.now() + 300000
            const url = Url.temporarySignedRoute('users.index', {}, expiration, mockApp as any)

            expect(url.getQuery()).toHaveProperty('signature')
            expect(url.getQuery()).toHaveProperty('expires')
        })

        it('should create URL from route action', () => {
            mockApp.make.mockReturnValue(app.make('app.routes'))
            const url = Url.action('ExampleController@index', {}, mockApp as any)
            expect(url.getPath()).toBe('/path/index')
        })
    })

    describe('Fluent Builder API', () => {
        let url: Url

        beforeEach(() => {
            url = Url.of('https://example.com/path')
        })

        it('should set scheme', () => {
            const newUrl = url.withScheme('http')

            expect(newUrl.getScheme()).toBe('http')
            expect(url.getScheme()).toBe('https') // Original unchanged
        })

        it('should set host', () => {
            const newUrl = url.withHost('test.com')

            expect(newUrl.getHost()).toBe('test.com')
            expect(url.getHost()).toBe('example.com') // Original unchanged
        })

        it('should set port', () => {
            const newUrl = url.withPort(8080)

            expect(newUrl.getPort()).toBe(8080)
            expect(url.getPort()).toBeUndefined() // Original unchanged
        })

        it('should set path', () => {
            const newUrl = url.withPath('/new-path')

            expect(newUrl.getPath()).toBe('/new-path')
            expect(url.getPath()).toBe('/path') // Original unchanged
        })

        it('should set query parameters', () => {
            const newUrl = url.withQuery({ page: 2, limit: 10 })

            expect(newUrl.getQuery()).toEqual({ page: 2, limit: 10 })
            expect(url.getQuery()).toEqual({}) // Original unchanged
        })

        it('should merge query parameters', () => {
            const urlWithQuery = url.withQuery({ page: 1 })
            const newUrl = urlWithQuery.withQueryParams({ limit: 10 })

            expect(newUrl.getQuery()).toEqual({ page: 1, limit: 10 })
        })

        it('should set fragment', () => {
            const newUrl = url.withFragment('section-1')

            expect(newUrl.getFragment()).toBe('section-1')
            expect(url.getFragment()).toBeUndefined() // Original unchanged
        })

        it('should chain multiple operations', () => {
            const newUrl = url
                .withScheme('http')
                .withHost('test.com')
                .withPort(8000)
                .withPath('/users')
                .withQuery({ page: 2 })
                .withFragment('section-1')

            expect(newUrl.toString()).toBe('http://test.com:8000/users?page=2#section-1')
        })
    })

    describe('URL String Generation', () => {
        it('should generate complete URL string', () => {
            const url = Url.of('https://example.com:8080/path?param=value#section')

            expect(url.toString()).toBe('https://example.com:8080/path?param=value#section')
        })

        it('should not include default ports', () => {
            const httpUrl = Url.of('http://example.com:80/path')
            const httpsUrl = Url.of('https://example.com:443/path')

            expect(httpUrl.toString()).toBe('http://example.com/path')
            expect(httpsUrl.toString()).toBe('https://example.com/path')
        })

        it('should handle array query parameters', () => {
            const url = Url.of('https://example.com').withQuery({
                tags: ['php', 'javascript'],
                single: 'value'
            })

            const urlString = url.toString()
            expect(urlString).toContain('tags%5B%5D=php')
            expect(urlString).toContain('tags%5B%5D=javascript')
            expect(urlString).toContain('single=value')
        })

        it('should encode query parameters', () => {
            const url = Url.of('https://example.com').withQuery({
                'special chars': 'hello world!',
                'unicode': 'café'
            })

            const urlString = url.toString()
            expect(urlString).toContain('special%20chars=hello%20world!')
            expect(urlString).toContain('unicode=caf%C3%A9')
        })

        it('should handle missing scheme or host', () => {
            // @ts-expect-error Url contructor is private
            const url = new Url(undefined, undefined, undefined, undefined, '/path')

            expect(url.toString()).toBe('/path')
        })

        it('should add leading slash to path when needed', () => {
            // @ts-expect-error Url contructor is private
            const url = new Url(undefined, 'https', 'example.com', undefined, 'path')

            expect(url.toString()).toBe('https://example.com/path')
        })
    })

    describe('URL Signing', () => {
        it('should add signature to URL', () => {
            const url = Url.of('https://example.com/path')
            const signedUrl = url.withSignature(mockApp as any)

            expect(signedUrl.getQuery()).toHaveProperty('signature')
        })

        it('should add expiration to temporary signed URL', () => {
            const url = Url.of('https://example.com/path')
            const expiration = Date.now() + 300000
            const signedUrl = url.withSignature(mockApp as any, expiration)

            expect(signedUrl.getQuery()).toHaveProperty('signature')
            expect(signedUrl.getQuery()).toHaveProperty('expires')
        })

        it('should validate signature correctly', () => {
            const url = Url.of('https://example.com/path')
            const signedUrl = url.withSignature(mockApp as any)

            expect(signedUrl.hasValidSignature(mockApp as any)).toBe(true)
        })

        it('should reject invalid signature', () => {
            const url = Url.of('https://example.com/path')
                .withQuery({ signature: 'invalid-signature' })

            expect(url.hasValidSignature(mockApp as any)).toBe(false)
        })

        it('should reject expired signature', () => {
            const url = Url.of('https://example.com/path')
            const pastExpiration = Date.now() - 1000
            const signedUrl = url.withSignature(mockApp as any, pastExpiration)

            expect(signedUrl.hasValidSignature(mockApp as any)).toBe(false)
        })

        it('should throw error when signing without app instance', () => {
            const url = Url.of('https://example.com/path')

            expect(() => url.withSignature()).toThrow('Application instance required for URL signing')
        })
    })

    describe('Edge Cases', () => {
        it('should handle empty query object', () => {
            const url = Url.of('https://example.com/path').withQuery({})

            expect(url.toString()).toBe('https://example.com/path')
        })

        it('should handle undefined and null query values', () => {
            const url = Url.of('https://example.com/path').withQuery({
                defined: 'value',
                undefined: undefined,
                null: null
            })

            const urlString = url.toString()
            expect(urlString).toContain('defined=value')
            expect(urlString).toContain('undefined=undefined')
            expect(urlString).toContain('null=null')
        })

        it('should preserve immutability', () => {
            const original = Url.of('https://example.com/path')
            const modified = original.withHost('test.com').withPath('/new')

            expect(original.getHost()).toBe('example.com')
            expect(original.getPath()).toBe('/path')
            expect(modified.getHost()).toBe('test.com')
            expect(modified.getPath()).toBe('/new')
        })
    })

    describe('Global Helpers', () => {
        it('should generate string when path is provided', () => {
            mockApp.make.mockReturnValue(app.make('app.routes'))

            expect(url('path')).toBe('https://example.com/path')
        })

        it('should generate a RequestAwareHelpers instance if path is not provided', () => {
            expect(url()).toBeInstanceOf(RequestAwareHelpers)
        })

        it('should generate a URL from route action', () => {
            expect(action('ExampleController@index'))
                .toBe('https://example.com/path/index')
        })

        it('should generate a URL from route action with route parameters', () => {
            expect(action('ExampleController@index', { id: 100, name: 'john' }))
                .toBe('https://example.com/path/index/100/john')
        })

        it('should generate a URL from route action, array style', () => {
            expect(action([ExampleController, 'index']))
                .toBe('https://example.com/path/index')
        })

        it('should generate a URL from the route method', () => {
            expect(route('path')).toBe('https://example.com/path')
        })
    })
})
