import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import { DB } from '@h3ravel/database'
import { DatabaseDriver } from '../src'
import { Encryption } from '../src/Encryption'
import { SessionServiceProvider } from '../src/Providers/SessionServiceProvider'
import { h3ravel } from '@h3ravel/core'
import path from 'node:path'

const appKey = 'base64:dnZm+Ei7ExEHzhj/wO/3YKUckMQtpLjRVk1VLYiV/es='

describe('@h3ravel/session Database Driver', () => {
    process.env.APP_KEY = appKey
    let driver: DatabaseDriver
    const table = 'sessions'
    const encryptor = new Encryption()
    const sessionId = 'test-session-123'

    beforeAll(async () => {
        const { DatabaseServiceProvider } = (await import(('@h3ravel/database')))
        const { HttpServiceProvider } = (await import(('@h3ravel/http')))
        const { ConfigServiceProvider } = (await import(('@h3ravel/config')))
        const { RouteServiceProvider } = (await import(('@h3ravel/router')))

        await h3ravel(
            [HttpServiceProvider, DatabaseServiceProvider, ConfigServiceProvider, RouteServiceProvider, SessionServiceProvider],
            path.join(process.cwd(), 'packages/session/tests'),
            {
                autoload: false,
                customPaths: {
                    config: 'config',
                    routes: 'routes',
                }
            })


        await DB.instance().schema.hasTable('sessions').then(async function (exists) {
            if (!exists) {
                return DB.instance().schema.createTable('sessions', (table) => {
                    table.string('id', 255).primary()
                    table.bigInteger('user_id').nullable().index()
                    table.string('ip_address', 45).nullable()
                    table.text('user_agent').nullable()
                    table.text('payload', 'longtext').nullable()
                    table.integer('last_activity').index()
                })
            }
        })

        driver = new DatabaseDriver(sessionId, table)
    })

    beforeEach(async () => {
        process.env.APP_KEY = appKey
        await driver.flush()
    })

    afterAll(async () => {
        await DB.instance().schema.dropTableIfExists(table)
    })

    it('should store and retrieve encrypted session data', async () => {
        await driver.put('user', { id: 1, name: 'Legacy' })
        const retrieved = await driver.get('user')
        expect(retrieved).toEqual({ id: 1, name: 'Legacy' })

        const raw = await DB.table(table).where('id', sessionId).first()
        expect(raw).toBeTruthy()
        expect(typeof raw.payload).toBe('string')

        // Decrypt manually to verify encryption
        const decrypted = encryptor.decrypt(raw.payload)
        expect(decrypted.user).toEqual({ id: 1, name: 'Legacy' })
    })

    it('should store multiple values with set()', async () => {
        await driver.set({ token: 'abc123', theme: 'dark' })
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
        await driver.put('temp', 'should-remove')
        await driver.forget('temp')
        const all = await driver.all()
        expect(all.temp).toBeUndefined()
    })

    it('should flush all data', async () => {
        await driver.put('user', 'data')
        await driver.flush()
        const all = await driver.all()
        expect(Object.keys(all).length).toBe(0)
    })

    it('should update last_activity on each save', async () => {
        const before = await DB.table(table).where('id', sessionId).first()
        const prevActivity = before.last_activity
        await new Promise((r) => setTimeout(r, 1000))
        await driver.put('time', Date.now())
        const after = await DB.table(table).where('id', sessionId).first()
        expect(after.last_activity).toBeGreaterThan(prevActivity)
    })

    it('returns default value when key not found', async () => {
        const result = await driver.get('missing', 'default')
        expect(result).toBe('default')
    })

    it('checks if key exists and has', async () => {
        await driver.put('existsKey', null)
        await driver.put('hasKey', 'something')
        expect(await driver.exists('existsKey')).toBe(true)
        expect(await driver.has('existsKey')).toBe(false)
        expect(await driver.has('hasKey')).toBe(true)
    })

    it('forgets a key', async () => {
        await driver.put('temp', 'gone')
        await driver.forget('temp')
        const val = await driver.get('temp')
        expect(val).toBeOneOf([null, undefined])
    })

    it('returns only specific keys', async () => {
        await driver.put('a', 1)
        await driver.put('b', 2)
        const result = await driver.only(['a'])
        expect(result).toEqual({ a: 1 })
    })

    it('returns all except specified keys', async () => {
        await driver.put('a', 1)
        await driver.put('b', 2)
        const result = await driver.except(['b'])
        expect(result).toEqual({ a: 1 })
    })

    it('pulls and removes a key', async () => {
        await driver.put('pullable', 'data')
        const val = await driver.pull('pullable')
        expect(val).toBe('data')
        expect(await driver.exists('pullable')).toBe(false)
    })

    it('increments and decrements values', async () => {
        await driver.put('counter', 1)
        await driver.increment('counter', 2)
        expect(await driver.get('counter')).toBe(3)
        await driver.decrement('counter', 1)
        expect(await driver.get('counter')).toBe(2)
    })

    it('flashes data for the next request', async () => {
        await driver.flash('flashKey', 'flashVal')
        expect(driver.flashBag.get('flashKey')).toBe('flashVal')
    })

    it('reflashes data', async () => {
        await driver.flash('f1', 'val')
        await driver.reflash()
        expect(driver.flashBag.get('f1')).toBe('val')
    })

    it('keeps selected flash keys', async () => {
        await driver.flash('keep1', 'val1')
        await driver.flash('keep2', 'val2')
        await driver.keep(['keep1'])
        expect(driver.flashBag.all()).toHaveProperty('keep1')
        expect(driver.flashBag.all()).not.toHaveProperty('keep2')
    })

    it('stores temporary data with now()', async () => {
        await driver.now('tmp', 'one-time')
        expect(driver.flashBag.get('tmp')).toBe('one-time')
    })

    it('regenerates session id while keeping data', async () => {
        await driver.put('persist', 'value')
        const oldId = (driver as any).sessionId
        await driver.regenerate()
        const newId = (driver as any).sessionId
        expect(newId).not.toBe(oldId)

        const count = await DB.table(table).count('id')
        expect(count).toBeGreaterThan(0)
    })

    it('invalidates session and creates a new empty one', async () => {
        await driver.put('temp', 'data')
        const oldId = (driver as any).sessionId
        await driver.invalidate()
        const newId = (driver as any).sessionId
        expect(newId).not.toBe(oldId)
        expect(await driver.all()).toEqual({})
    })

    it('determine if an item is not present in the session', async () => {
        await driver.put('present', 1)
        const missing = await driver.missing('absent')
        expect(missing).toEqual(true)
    })
})