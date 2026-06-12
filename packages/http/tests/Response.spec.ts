import { beforeEach, describe, expect, it, vi } from 'vitest'

import { Helpers } from '@h3ravel/foundation'
import { H3Event } from 'h3'
import { Response } from '../src/Response'

// Mock classes
class Application {
    private event?: H3Event
    private response?: Response

    getHttpContext (key?: string) {
        const context = { event: this.event }
        return key ? context[key as keyof typeof context] : context
    }

    make (key: string) {
        if (key === 'http.response') return this.response
    }

    setEvent (event: H3Event) {
        this.event = event
    }

    setResponse (response: Response) {
        this.response = response
    }
}
function makeEvent (overides: Record<string, any> = {}) {
    globalThis.dump = () => { }
    const url = new URL(overides.url ?? '/test', 'http://localhost')
    return new H3Event(new Request(url))
}

// Mock implementation for inherited methods
vi.mock('@/http/HttpResponse', () => {
    return {
        HttpResponse: class {
            event: any
            constructor(event: any) {
                this.event = event
            }
            setStatusCode = vi.fn().mockReturnThis()
            setHeader = vi.fn().mockReturnThis()
        },
    }
})

describe('Response', () => {
    let event: any
    let app: any
    let iResponse: Response

    beforeEach(() => {
        event = makeEvent()
        app = new Application()
        app.setEvent(event)
        iResponse = new Response(app, event)
        app.setResponse(iResponse)
        Helpers.load(app)
    })

    it('stores the app and event', () => {
        expect(iResponse.app).toBe(app)
        expect(iResponse.getEvent()).toBe(event)
    })

    it('sends html content', () => {
        const result = iResponse.html('<p>Hello</p>', true)
        expect(result).toBeTypeOf('object')
    })

    it('sends json data', () => {
        const data = { ok: true }
        const result = iResponse.json(data, true) as any
        expect(result.body).toEqual(JSON.stringify(data))
    })

    it('sends text content', () => {
        const result = iResponse.text('plain text', true)
        expect(result).toBeTypeOf('object')
    })

    it('sends xml content', () => {
        const xml = '<note>Hello</note>'
        const result = iResponse.xml(xml, true)
        expect(result).toBeTypeOf('object')
    })

    it('redirects properly', () => {
        const res = iResponse.redirect('/home', 302)
        expect(res).toBeTypeOf('object')
    })

    it('dump returns instance', () => {
        const res = iResponse.dump()
        expect(res).toBe(iResponse)
    })

    it('sendContent handles json', () => {
        const res = iResponse.sendContent('json')
        expect(res).toBeDefined()
    })

    it('send handles text', () => {
        const res = iResponse.send('text')
        expect(res).toBeDefined()
    })

    it('getEvent with key returns nested value', () => {
        const r = new Response(app, makeEvent({ url: '/foo' }))
        expect(r.getEvent('req.url')).toBe('http://localhost/foo')
    })

    it('returns Response class instance from global response helper', async () => {
        const res = new Response(app, makeEvent({ url: '/foo' }))
        app.setResponse(res)

        expect(response()).toBe(res)
        expect(response()).toBeInstanceOf(Response)
    })
})
