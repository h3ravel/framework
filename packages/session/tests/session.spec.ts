import { Application, h3ravel } from '@h3ravel/core'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { existsSync, readFileSync } from 'node:fs'
import { mkdtemp, rmdir } from 'node:fs/promises'

import { DB } from '@h3ravel/database'
import { DatabaseDriver } from '../src'
import { Encryption } from '../src/Encryption'
import { HttpContext } from '@h3ravel/shared'
import { SessionManager } from '../src/SessionManager'
import { SessionServiceProvider } from '../src/Providers/SessionServiceProvider'
import path from 'node:path'
import { tmpdir } from 'node:os'

let ctx: HttpContext
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

describe('@h3ravel/session', () => {
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
        const { Request, Response, HttpContext } = (await import(('@h3ravel/http')))

        ctx = HttpContext.init({
            app,
            request: await Request.create(event, app),
            response: new Response(event, app),
        }, event)

        process.env.APP_KEY = appKey
    })


    describe('Memory Driver', () => {
        let session: SessionManager

        beforeEach(async () => {
            session = new SessionManager(ctx, 'memory')
        })

        it('can persist sessions', async () => {
            const data = { name: 'string' }
            const session = new SessionManager(ctx, 'memory')
            session.set('app', data)

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
            session.set('foo', 'bar')
            expect(session.get('foo')).toBe('bar')
        })

        it('should push to an array', () => {
            session.set('arr', [])
            session.push('arr', 'x')
            session.push('arr', 'y')
            expect(session.get('arr')).toEqual(['x', 'y'])
        })

        it('should flush all data', () => {
            session.set('foo', 'bar')
            session.flush()
            expect(session.all()).toEqual({})
        })

        it('should forget a key', () => {
            session.set('temp', 123)
            session.forget('temp')
            expect(session.get('temp')).toBeUndefined()
        })

        it('should put multiple values', () => {
            session.put({ a: 1, b: 2 })
            expect(session.get('a')).toBe(1)
            expect(session.get('b')).toBe(2)
        })
    })

    describe('File Driver', () => {
        let tmpDir: string
        let session: SessionManager

        beforeEach(async () => {
            session = new SessionManager(ctx, 'file', { cwd: tmpDir, sessionDir: 'storage/sessions' })
        })

        beforeAll(async () => {
            tmpDir = await mkdtemp(path.join(tmpdir(), '@h3ravel-session'))
        })

        afterAll(async () => {
            await rmdir(tmpDir, { recursive: true, maxRetries: 2 })
        })

        it('should generate a session ID and create a file', () => {
            const file = path.join(tmpDir, `storage/sessions/${session.id()}.json`)
            expect(existsSync(file)).toBe(true)
        })


        it('should set and get values', () => {
            session.set('foo', 'bar')
            expect(session.get('foo')).toBe('bar')

            const content = readFileSync(path.join(tmpDir, `storage/sessions/${session.id()}.json`), 'utf8')
            expect(content).toContain(':') // encrypted string has iv:data
        })

        it('can persist sessions', async () => {
            const data = { name: 'string' }
            session.set('app', data)

            expect(session.get('app')).toMatchObject(data)
        })

        it('should flush all data', () => {
            session.set('x', 1)
            session.flush()
            const all = session.all()
            expect(all).toEqual({})
        })
    })

    describe('Database Driver', () => {
        process.env.APP_KEY = appKey
        let session: SessionManager
        let driver: DatabaseDriver
        const table = 'sessions'
        const encryptor = new Encryption()
        const sessionId = 'test-session-123'

        beforeAll(async () => {
            if (!(await DB.instance().schema.hasTable('sessions'))) {
                await DB.instance().schema.createTable(table, (table) => {
                    table.string('id', 255).primary()
                    table.bigInteger('user_id').nullable()
                    table.string('ip_address').nullable()
                    table.text('user_agent').nullable()
                    table.text('payload', 'longtext').nullable()
                    table.integer('last_activity')
                })
            }

            driver = new DatabaseDriver(sessionId, table)
            session = new SessionManager(ctx, 'database', { table, sessionId })
        })

        afterAll(async () => {
            await DB.instance().schema.dropTableIfExists(table)
        })

        it('should store and retrieve encrypted session data', async () => {
            await session.set('app', { data: '123' })
            console.log(await session.get('app'))


            await driver.set('user', { id: 1, name: 'Legacy' })
            const retrieved = await driver.get('user')
            expect(retrieved).toEqual({ id: 1, name: 'Legacy' })

            const raw = await DB.table(table).where('id', sessionId).first()
            expect(raw).toBeTruthy()
            expect(typeof raw.payload).toBe('string')

            // Decrypt manually to verify encryption
            const decrypted = encryptor.decrypt(raw.payload)
            expect(decrypted.user).toEqual({ id: 1, name: 'Legacy' })
        })

        it('should store multiple values with put()', async () => {
            await driver.put({ token: 'abc123', theme: 'dark' })
            const all = await driver.all()
            expect(all.token).toBe('abc123')
            expect(all.theme).toBe('dark')
        })

        it('should append values with push()', async () => {
            await driver.push('logs', 'login')
            await driver.push('logs', 'logout')
            const all = await driver.all()
            expect(all.logs).toEqual(['login', 'logout'])
        })

        it('should forget a key', async () => {
            await driver.set('temp', 'should-remove')
            await driver.forget('temp')
            const all = await driver.all()
            expect(all.temp).toBeUndefined()
        })

        it('should flush all data', async () => {
            await driver.set('user', 'data')
            await driver.flush()
            const all = await driver.all()
            expect(Object.keys(all).length).toBe(0)
        })

        it('should update last_activity on each save', async () => {
            const before = await DB.table(table).where('id', sessionId).first()
            const prevActivity = before.last_activity
            await new Promise((r) => setTimeout(r, 1000))
            await driver.set('time', Date.now())
            const after = await DB.table(table).where('id', sessionId).first()
            expect(after.last_activity).toBeGreaterThan(prevActivity)
        })
    })
})