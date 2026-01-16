import { Application, h3ravel } from '@h3ravel/core'
import { beforeAll, beforeEach, describe, expect, it } from 'vitest'

import { Encryption } from '../src/Encryption'
import { IHttpContext } from '@h3ravel/contracts'
import { SessionManager } from '../src/SessionManager'
import { SessionServiceProvider } from '../src/Providers/SessionServiceProvider'
import path from 'node:path'

let ctx: IHttpContext
let app: Application
let event: any
const appKey = 'base64:dnZm+Ei7ExEHzhj/wO/3YKUckMQtpLjRVk1VLYiV/es='

function makeEvent (overides: Record<string, any> = {}) {
    return {
        res: { headers: new Headers(), statusCode: 200, cookie: () => { } },
        req: {
            headers: new Headers({
                'user-agent': 'Vitest',
                'x-forwarded-for': '127.0.0.1'
            }),
            url: overides.url ?? 'http://localhost/test', method: 'get'
        },
    } as any
}

describe('@h3ravel/session MemoryDriver', () => {
    let session: SessionManager

    beforeAll(async () => {
        const { DatabaseServiceProvider } = (await import(('@h3ravel/database')))
        const { HttpServiceProvider } = (await import(('@h3ravel/http')))
        const { ConfigServiceProvider } = (await import(('@h3ravel/config')))
        const { RouteServiceProvider } = (await import(('@h3ravel/router')))
        app = await h3ravel(
            [HttpServiceProvider, DatabaseServiceProvider, ConfigServiceProvider, RouteServiceProvider, SessionServiceProvider],
            path.join(process.cwd(), 'packages/session/tests'),
            {
                autoload: false,
                customPaths: {
                    config: 'config',
                    routes: 'routes',
                }
            })
    })

    beforeEach(async () => {
        event = makeEvent()
        const { Request, Response, HttpContext } = await import('@h3ravel/http')

        ctx = HttpContext.init({
            app,
            request: await Request.create(event, app),
            response: new Response(app, event),
        }, event)

        process.env.APP_KEY = appKey

        session = new SessionManager(ctx, 'memory')
    })

    it('can persist sessions', async () => {
        const data = { name: 'string' }
        const session = new SessionManager(ctx, 'memory')
        session.put('app', data)

        expect(session.get('app')).toMatchObject(data)
    })

    it('can encrypt and decrypt using APP_KEY', async () => {
        const str = 'Hello World'
        const encryptor = new Encryption()
        const enc = encryptor.encrypt(str)
        const dec = encryptor.decrypt(enc)

        expect(typeof enc === 'string').toBeTruthy()
        expect(typeof dec === 'string').toBeTruthy()
        expect(dec).toBe(str)
    })

    it('should generate a session ID', () => {
        expect(session.id()).toBeTypeOf('string')
        expect(session.id().length).toBeGreaterThan(0)
    })

    it('should set and get a value', () => {
        session.put('foo', 'bar')
        expect(session.get('foo')).toBe('bar')
    })

    it('should push to an array', () => {
        session.put('arr', [])
        session.push('arr', 'x')
        session.push('arr', 'y')
        expect(session.get('arr')).toEqual(['x', 'y'])
    })

    it('should flush all data', () => {
        session.put('foo', 'bar')
        session.flush()
        expect(session.all()).toEqual({})
    })

    it('should forget a key', () => {
        session.put('temp', 123)
        session.forget('temp')
        expect(session.get('temp')).toBeUndefined()
    })

    it('should set multiple values', () => {
        session.set({ a: 1, b: 2 })
        expect(session.get('a')).toBe(1)
        expect(session.get('b')).toBe(2)
    })

    it('returns default value when key not found', async () => {
        const result = await session.get('missing', 'default')
        expect(result).toBe('default')
    })

    it('checks if key exists and has', async () => {
        await session.put('existsKey', null)
        await session.put('hasKey', 'something')
        expect(await session.exists('existsKey')).toBe(true)
        expect(await session.has('existsKey')).toBe(false)
        expect(await session.has('hasKey')).toBe(true)
    })

    it('forgets a key', async () => {
        await session.put('temp', 'gone')
        await session.forget('temp')
        const val = await session.get('temp')
        expect(val).toBeOneOf([null, undefined])
    })

    it('returns only specific keys', async () => {
        await session.put('a', 1)
        await session.put('b', 2)
        const result = await session.only(['a'])
        expect(result).toEqual({ a: 1 })
    })

    it('returns all except specified keys', async () => {
        await session.put('a', 1)
        await session.put('b', 2)
        const result = await session.except(['b'])
        expect(result).toEqual({ a: 1 })
    })

    it('pulls and removes a key', async () => {
        await session.put('pullable', 'data')
        const val = await session.pull('pullable')
        expect(val).toBe('data')
        expect(await session.exists('pullable')).toBe(false)
    })


    it('increments and decrements values', async () => {
        await session.put('counter', 1)
        await session.increment('counter', 2)
        expect(await session.get('counter')).toBe(3)
        await session.decrement('counter', 1)
        expect(await session.get('counter')).toBe(2)
    })


    it('stores temporary data with now()', async () => {
        await session.now('tmp', 'one-time')
        expect(session.flashBag.get('tmp')).toBe('one-time')
    })

    it('determine if an item is not present in the session', async () => {
        await session.put('present', 1)
        const missing = await session.missing('absent')
        expect(missing).toEqual(true)
    })
})