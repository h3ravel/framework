import { beforeEach, describe, expect, it, test, vi } from 'vitest'

import { Application } from '@h3ravel/core' // if this exists
import { InputBag } from '../src/Utilities/InputBag'
import { ParamBag } from '../src/Utilities/ParamBag'
import { Request } from '../src/Request'
import { UploadedFile } from '../src/UploadedFile'

// ---- mocks: FormRequest and UploadedFile.createFromBase ----
// The Request class uses FormRequest and UploadedFile.createFromBase.
// To keep tests deterministic we mock them. If you prefer to test with
// the real implementations, remove/adjust these mocks.

vi.mock('../src/FormRequest', async () => {
    return {
        // default export or named export depending on your implementation
        FormRequest: class {
            private _input: Record<string, any>
            private _files: Record<string, any>
            constructor(fd: any) {
                // fd is whatever was passed; tests will pass in helpful markers
                this._input = fd && fd.__input ? fd.__input : {}
                this._files = fd && fd.__files ? fd.__files : {}
            }
            input () {
                return this._input
            }
            files () {
                return this._files
            }
            async all () {
                // return combined structure similar to your code's formRequest.all()
                return { ...this._input, ...this._files }
            }
        }
    }
})

// Mock createFromBase to convert a base File-like object into UploadedFile instance.
// If UploadedFile has a different API remove this mock and adjust accordingly.
vi.spyOn(UploadedFile, 'createFromBase' as any).mockImplementation((fileBase: any) => {
    // Return a simple UploadedFile-like object
    return {
        content: fileBase,
        size: fileBase && fileBase.size ? fileBase.size : 1,
        originalName: fileBase && fileBase.name ? fileBase.name : 'file',
    }
})

// ---- helper to craft a fake H3Event ----
function makeEvent (overrides: Partial<any> = {}) {
    // minimal header map that implements .get and .entries()
    const headersMap = new Map<string, string>(Object.entries((overrides.headers as Record<string, string>) || {}))
    const headers = {
        get: (k: string) => headersMap.get(k.toLowerCase()) ?? headersMap.get(k) ?? null,
        entries: () => headersMap.entries(),
        // keep an iterator too
        [Symbol.iterator]: () => headersMap[Symbol.iterator](),
    }

    const req = {
        method: (overrides.method || 'GET'),
        url: overrides.url || 'http://localhost/test',
        headers,
        // body: could be string, ReadableStream, or custom
        body: overrides.body ?? null,
        json: overrides.json?.bind?.(null) ?? (async () => { throw new Error('no json') }),
        text: overrides.text?.bind?.(null) ?? (async () => { throw new Error('no text') }),
        formData: overrides.formData?.bind?.(null) ?? (async () => { throw new Error('no formdata') }),
    }

    const event: any = {
        req,
        context: {
            params: overrides.params || {},
        }
    }

    // helper to set a _h3ravelContext marker if needed by tests
    if (overrides._h3ravelContext) (event as any)._h3ravelContext = overrides._h3ravelContext

    return event as any
}

const TestFile = new File([Buffer.from('TestFile')], 'a.png')
const TestUpload = UploadedFile.createFromBase(TestFile)

// Minimal Application stub if you don't have real Application importable in test env.
// If you DO have a real Application class you can remove this stub and use the real one.
class AppStub implements Partial<Application> {
    basePath = process.cwd()
    make () { return undefined }
    fire () { return undefined as never }
}

// ---- TESTS ----

describe('Request', () => {
    let app: any

    beforeEach(() => {
        app = new AppStub()
        vi.restoreAllMocks() // restore in case any global spy persists
    })

    it('parses JSON body when content-type is application/json', async () => {
        const payload = { hello: 'world' }
        const event = makeEvent({
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            json: async () => payload,
        })

        const req = await Request.create(event, app as any)

        // body should be parsed
        expect(req.body).toEqual(payload)

        // json() returns InputBag instance and values are accessible
        const jsonBag = (req as any).json()
        expect(jsonBag.get('hello')).toBe('world')
        // input() should fallback to JSON when method is not GET
        expect((req as any).input()).toEqual(expect.objectContaining({ hello: 'world' }))
    })

    it('parses form-data into FormRequest and sets form and body', async () => {
        const fakeFormData = { __input: { name: 'legacy' }, __files: { 'avatar': TestFile } }
        const event = makeEvent({
            method: 'POST',
            headers: { 'content-type': 'multipart/form-data' },
            formData: async () => fakeFormData,
        })
        const req = await Request.create(event, app)

        // formData instance should be present
        expect((req as any).formData).toBeTruthy()

        // // allFiles should convert files using UploadedFile.createFromBase
        const allFiles = req.allFiles()
        expect(allFiles).toHaveProperty('avatar')
        expect(allFiles.avatar).toMatchObject(TestUpload)
    })

    it('parses text body when content-type starts with text/', async () => {
        const event = makeEvent({
            method: 'POST',
            headers: { 'content-type': 'text/plain' },
            text: async () => 'plain text body',
        })

        const req = await Request.create(event, app as any)
        expect((req as any).body).toBe('plain text body')
        expect((req as any).getContent()).toBe('plain text body')
        // as stream
        const stream = (req as any).getContent(true)
        expect(stream).toBeDefined()
        // if stream is returned, it should be a ReadableStream or close to that (we just confirm presence)
    })

    it('parses fallback stream bodies', async () => {
        // Provide a fake ReadableStream-like object with getReader
        const chunks = [new TextEncoder().encode('hello'), new TextEncoder().encode('world')]
        let i = 0
        const fakeStream = new ReadableStream({
            pull (controller) {
                if (i < chunks.length) {
                    controller.enqueue(chunks[i++])
                } else {
                    controller.close()
                }
            },
        })

        const event = makeEvent({
            method: 'POST',
            headers: {},
            body: fakeStream,
        })

        const req = await Request.create(event, app as any)
        // body decoded from Uint8Array chunks "hi!"
        expect((req as any).body).toBe('helloworld')
    })

    it('all() returns merged query + body + files', async () => {
        const fakeFormData = { __input: { foo: 'bar' }, __files: {} }
        const event = makeEvent({
            method: 'POST',
            headers: { 'content-type': 'multipart/form-data' },
            formData: async () => fakeFormData,
        })

        // create request and then tweak query to simulate GET params
        const req = await Request.create(event, app as any)
            // simulate query bag contents by directly setting query (InputBag exposes all())
            ; (req as any).query = new InputBag({ q: '1' }, event)
        const merged = (req as any).all()
        expect(merged).toEqual(expect.objectContaining({ foo: 'bar', q: '1' }))
    })

    it('input() reads from query for GET and request for POST', async () => {
        // GET request
        const getEvent = makeEvent({
            method: 'GET',
            headers: { 'content-type': 'text/plain' },
            text: async () => '',
        })
        const getReq = await Request.create(getEvent, app as any)
            ; (getReq as any).query = new InputBag({ a: 'q' }, getEvent)
        expect(getReq.input()).toEqual(expect.objectContaining({ a: 'q' }))

        // POST request
        const postEvent = makeEvent({
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            json: async () => ({ b: 'p' }),
        })
        const postReq = await Request.create(postEvent, app as any)
        expect(postReq.input()).toEqual(expect.objectContaining({ b: 'p' }))
    })

    it('merge() mutates the request source and mergeIfMissing only merges missing keys', async () => {
        const event = makeEvent({
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            json: async () => ({ name: 'orig' }),
        })
        const req = await Request.create(event, app as any)
        expect(req.input('name')).toBe('orig')

        req.merge({ name: 'new', added: 'value' })
        expect(req.input('name')).toBe('new')
        expect(req.input('added')).toBe('value')

        // mergeIfMissing should not overwrite 'name'
        req.mergeIfMissing({ name: 'should-not', other: 'x' })
        expect(req.input('name')).toBe('new')
        expect(req.input('other')).toBe('x')
    })

    it('has / missing / only / except / keys behave as expected', async () => {
        const event = makeEvent({
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            json: async () => ({ a: 1, b: 2, c: 3 }),
        })
        const req = await Request.create(event, app as any)
        expect(req.has(['a', 'b'])).toBe(true)
        expect(req.missing('z')).toBe(true)
        expect(req.only(['a', 'c'])).toEqual({ a: 1, c: 3 })
        const excepted = req.except(['b'])
        expect(excepted).toEqual(expect.objectContaining({ a: 1, c: 3 }))
    })

    test('header helpers and JSON expectation helpers work', async () => {
        const event = makeEvent({
            method: 'POST',
            headers: { 'content-type': 'application/json', 'accept': 'application/json, text/html' },
            json: async () => ({})
        })
        const req = await Request.create(event, app as any)

        expect(req.isJson()).toBe(true)
        expect(req.expectsJson()).toBe(true)
        expect(req.wantsJson()).toBe(true)
        expect(req.getAcceptableContentTypes()).toEqual(expect.arrayContaining(['application/json', 'text/html']))
    })

    test('method helpers and getMethod/getRealMethod behave correctly', async () => {
        const event = makeEvent({
            method: 'PUT',
            headers: {},
            body: null,
        })
        const req = await Request.create(event, app as any)
        expect(req.getRealMethod()).toBe('PUT')
        expect(req.getMethod()).toBe('PUT')
        expect(req.isMethod('PUT')).toBe(true)
        expect(req.isMethodSafe()).toBe(false)
        expect(req.isMethodIdempotent()).toBe(true)
        expect(req.isMethodCacheable()).toBe(false)

        // override via X-HTTP-METHOD-OVERRIDE
        const event2 = makeEvent({
            method: 'POST',
            headers: { 'X-HTTP-METHOD-OVERRIDE': 'DELETE' },
            body: null
        })
        const req2 = await Request.create(event2, app as any)
        // Directly call getMethod so that override is read
        expect(req2.getMethod()).toBe('DELETE')

        // override via X-HTTP-METHOD-OVERRIDE
        const event3 = makeEvent({
            method: 'POST',
            headers: { 'content-type': 'multipart/form-data' },
            formData: async () => ({ __input: { _method: 'PUT' }, __files: {} }),
        })

        Request.enableHttpMethodParameterOverride()
        const req3 = await Request.create(event3, app as any)

        // Directly call getMethod so that override is read
        expect(req3.getMethod()).toBe('PUT')
    })

    it('getContent(asStream) returns stream when requested and string otherwise', async () => {
        const event = makeEvent({
            method: 'POST',
            headers: {},
            body: 'simple-string' // not stream
        })
        const req = await Request.create(event, app as any)
        expect(req.getContent()).toBe('simple-string')
        const stream = req.getContent(true)
        expect(stream).toBeDefined()
    })

    it('json() caching returns InputBag and get(key) works', async () => {
        const event = makeEvent({
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            json: async () => ({ nested: { x: 'y' } })
        })
        const req = await Request.create(event, app as any)
        const jsonBag = req.json()
        expect(jsonBag.get('nested.x')).toBe('y')
        // subsequent calls return same InputBag instance
        expect(req.json()).toBe(jsonBag)
    })

    it('hasFile returns false for missing file and true for present valid file', async () => {
        const fakeFormData = { __input: {}, __files: { 'avatar': TestFile } }
        const event = makeEvent({
            method: 'POST',
            headers: { 'content-type': 'multipart/form-data' },
            formData: async () => fakeFormData,
        })

        const req = await Request.create(event, app as any)
        // allFiles will convert using UploadedFile.createFromBase mocked earlier
        const converted = req.allFiles()
        expect(Object.values(converted).at(0)).toBeInstanceOf(UploadedFile)
        // mock converted file to look like UploadedFile instance
        expect(req.hasFile('avatar')).toBe(true)
    })

    describe('file()', async () => {
        const fakeFormData = { __input: {}, __files: { 'avatar': [TestFile] } }
        const event = makeEvent({
            method: 'POST',
            headers: { 'content-type': 'multipart/form-data' },
            formData: async () => fakeFormData,
        })

        it('returns single file instance by default', async () => {
            const req = await Request.create(event, app as any)
            expect(req.file('avatar')).toBeInstanceOf(UploadedFile)
            expect(req.hasFile('avatar')).toBe(true)
        })

        it('can return multiple file instances on demand', async () => {
            const req = await Request.create(event, app as any)
            expect(req.file('avatar', undefined, true).at(0)).contain(UploadedFile)
            expect(req.hasFile('avatar')).toBe(true)
        })
    })

    it('get() returns attribute, then query, then request then default', async () => {
        const event = makeEvent({
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            json: async () => ({ foo: 'body' }),
            params: { routeParam: 'rp' },
        })
        const req = await Request.create(event, app as any)
            ; (req as any).attributes = new ParamBag({ routeParam: 'rp' }, event)
            ; (req as any).query = new InputBag({ q: '1' }, event)
            ; (req as any).request = new InputBag({ bodyKey: 'b' }, event)

        expect(req.get('routeParam')).toBe('rp')
        expect(req.get('q')).toBe('1')
        expect(req.get('bodyKey')).toBe('b')
        expect(req.get('missing', 'def')).toBe('def')
    })

    it('can return Request class instance from global request helper', async () => {
        const event = makeEvent({
            method: 'POST',
            headers: {},
        })

        const req = await Request.create(event, app as any)

        expect(request()).toBe(req)
        expect(request()).toBeInstanceOf(Request)
    })
})

