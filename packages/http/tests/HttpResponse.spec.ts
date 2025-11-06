import { beforeEach, describe, expect, it } from 'vitest'

import { Application } from '@h3ravel/core'
import { DateTime } from 'luxon'
import { HttpResponse } from '../src/Utilities/HttpResponse'
import { Request } from '../src/Request'

// Mock H3Event
function makeEvent () {
    return {
        res: { headers: new Headers(), statusCode: 200 },
        req: { headers: new Headers(), url: 'http://localhost/test', method: 'get' },
    } as any
}

class AppStub implements Partial<Application> {
    basePath = process.cwd()
    make () { return undefined }
    fire () { return undefined as never }
}

describe('HttpResponse', () => {
    let app: any
    let response: HttpResponse

    beforeEach(() => {
        app = new AppStub()
        const event = makeEvent()
        response = new HttpResponse(event as any)
        // Patch the protected header bag
    })

    it('sets and retrieves the status code', () => {
        response.setStatusCode(201)
        expect(response.getStatusCode()).toBe(201)
    })

    it('sets and retrieves the content', () => {
        response.setContent('Hello')
        expect(response.getContent()).toBe('Hello')
    })

    it('sets and retrieves the charset', () => {
        response.setCharset('utf-8')
        expect(response.getCharset()).toBe('utf-8')
    })

    it('sets a header correctly', () => {
        response.setHeader('Content-Type', 'application/json')
        const headers = (response as any).headers.all()
        expect(headers['content-type']).toEqual(['application/json'])
    })

    it('marks response as private and public', () => {
        response.setPrivate()
        const headersPrivate = (response as any).headers.all()
        expect(headersPrivate['cache-control']).toContain('private')

        response.setPublic()
        const headersPublic = (response as any).headers.all()
        expect(headersPublic['cache-control']).toContain('public')
    })

    it('sets ETag header properly', () => {
        response.setEtag('abc123')
        const headers = (response as any).headers.all()
        expect(headers['etag']).toEqual(['"abc123"'])
    })

    it('sets Last-Modified header properly', () => {
        const date = DateTime.now()
        response.setLastModified(date as never)
        const headers = (response as any).headers.all()
        expect(headers['last-modified']).toContain(date.toHTTP())
    })

    it('identifies successful responses', () => {
        response.setStatusCode(200)
        expect(response.isSuccessful()).toBe(true)
        expect(response.isOk()).toBe(true)
    })

    it('identifies client errors', () => {
        response.setStatusCode(404)
        expect(response.isClientError()).toBe(true)
        expect(response.isNotFound()).toBe(true)
    })

    it('identifies server errors', () => {
        response.setStatusCode(500)
        expect(response.isServerError()).toBe(true)
    })

    it('identifies redirect responses', () => {
        response.setStatusCode(302)
            ; (response as any).headers.set('Location', '/home')
        expect(response.isRedirect()).toBe(true)
        expect(response.isRedirect('/home')).toBe(true)
    })

    it('sets cache directives correctly', () => {
        response.setCache({ public: true, max_age: 60 })
        const headers = (response as any).headers.all()
        expect(headers['cache-control']).toEqual(['max-age=60, public'])
    })

    it('throws response as exception', () => {
        class HttpResponseException extends Error { }
        ; (global as any).HttpResponseException = HttpResponseException

        expect(() => response.throwResponse()).toThrow()
    })

    it('withHeaders merges multiple headers', () => {
        response.withHeaders({ 'X-Test': '1', 'X-App': '2' })
        const headers = (response as any).headers.all()
        expect(headers['x-test']).toEqual(['1'])
        expect(headers['x-app']).toEqual(['2'])
    })

    it('computes expires, max-age, and ttl correctly', () => {
        response.setMaxAge(120)
        const headers = (response as any).headers.all()
        expect(headers['cache-control']).toEqual(['max-age=120, private'])
    })

    it('isEmpty detects no content responses', () => {
        response.setStatusCode(204)
        expect(response.isEmpty()).toBe(true)
    })

    it('prepare ensures proper status normalization', async () => {
        const mockReq = await Request.create(makeEvent(), app)
        expect(response.prepare(mockReq as any)).toBeInstanceOf(HttpResponse)
    })
})
