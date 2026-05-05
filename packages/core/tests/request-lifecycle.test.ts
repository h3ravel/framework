import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@h3ravel/foundation', () => ({
    MiddlewareHandler: class MiddlewareHandler { },
}))

vi.mock('../src/index', () => ({
    Application: class Application { },
}))

describe('HTTP request lifecycle isolation', () => {
    let container: import('../src/Container').Container

    beforeEach(async () => {
        const { Container } = await import('../src/Container')
        container = new Container()
    })

    it('resolves the latest response after http.response is rebound for a new request', () => {
        const first = { status: 200, headers: new Headers() }
        const second = { status: 200, headers: new Headers() }

        container.bind('http.response', () => first as never)
        expect(container.make('http.response')).toBe(first)

        first.status = 404
        container.bind('http.response', () => second as never)

        expect(container.make('http.response')).toBe(second)
        expect(container.make('http.response').getStatusCode()).toBe(200)
    })

    it('does not keep redirect response state after request bindings are rebound', () => {
        const first = { status: 302, headers: new Headers({ location: '/form' }) }
        const second = { status: 200, headers: new Headers() }

        container.bind('http.response', () => first as never)
        expect(container.make('http.response')).toBe(first)

        container.bind('http.response', () => second as never)

        const resolved = container.make('http.response')
        expect(resolved).toBe(second)
        expect(resolved.getStatusCode()).toBe(200)
        expect(resolved.headers.get('location')).toBeNull()
    })
})
