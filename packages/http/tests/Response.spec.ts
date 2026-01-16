import { beforeEach, describe, expect, it, vi } from 'vitest'

import { Response } from '../src/Response'

// Mock classes
class Application { }
function makeEvent (overides: Record<string, any> = {}) {
    globalThis.dump = () => { }
    return {
        res: { headers: new Headers(), statusCode: 200 },
        req: { headers: new Headers(), url: overides.url ?? 'http://localhost/test', method: 'get' },
    } as any
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
        iResponse = new Response(app, event)
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
        expect(r.getEvent('req.url')).toBe('/foo')
    })

    it('returns Response class instance from global response helper', async () => {
        const res = new Response(app, makeEvent({ url: '/foo' }))

        expect(response()).toBe(res)
        expect(response()).toBeInstanceOf(Response)
    })
})
