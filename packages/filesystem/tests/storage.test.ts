import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { mkdtempSync, rmSync } from 'node:fs'

import { Driver } from '../src/Driver'
import { FilesystemManager } from '../src/FilesystemManager'
import { GCSDriver } from 'flydrive/drivers/gcs'
import { driver } from './helpers'
import { join } from 'node:path'
import { tmpdir } from 'node:os'

type TestConfig = Record<string, any>

function getConfigValue (values: TestConfig, key?: string, defaultValue?: any) {
    if (!key) return values

    const value = key.split('.').reduce<any>((current, segment) => {
        return current?.[segment]
    }, values)

    return value ?? defaultValue
}

describe('Filesystem Storage', () => {
    let root: string
    let originalConfig: typeof globalThis.config | undefined
    let values: TestConfig

    beforeEach(() => {
        root = mkdtempSync(join(tmpdir(), 'h3ravel-filesystem-'))
        originalConfig = globalThis.config
        values = {
            filesystem: {
                default: 'local',
                disks: {
                    local: {
                        driver: 'local',
                        location: join(root, 'local'),
                        visibility: 'public',
                    },
                    public: {
                        driver: 'local',
                        location: join(root, 'public'),
                        visibility: 'public',
                    },
                },
                links: {},
            },
        }

        globalThis.url = ((key?: string) => 'http://localhost/storage/' + key) as never

        globalThis.config = ((key?: string | TestConfig, defaultValue?: any) => {
            if (typeof key === 'object') {
                values = key
                return
            }

            return getConfigValue(values, key, defaultValue)
        }) as typeof globalThis.config
    })

    afterEach(() => {
        Driver.removeDriver('memory')
        rmSync(root, { recursive: true, force: true })

        if (originalConfig) {
            globalThis.config = originalConfig
        } else {
            delete (globalThis as any).config
        }
    })

    function makeStorage () {
        return new FilesystemManager()
    }

    it('uses the configured default disk and switches between configured disks', () => {
        const storage = makeStorage()

        expect(storage.getDiskName()).toBe('local')
        expect(storage.getDriverName()).toBe('local')

        expect(storage.disk('public')).toBe(storage)
        expect(storage.getDiskName()).toBe('public')
        expect(storage.getDriverName()).toBe('local')
    })

    it('performs common file operations consistently on the local driver', async () => {
        const storage = makeStorage()

        await storage.put('documents/original.txt', 'hello flydrive')

        expect(await storage.exists('documents/original.txt')).toBe(true)
        expect(await storage.get('documents/original.txt')).toBe('hello flydrive')
        expect(await storage.getUrl('documents/original.txt'))
            .toBe('http://localhost/storage/documents/original.txt')

        await storage.copy('documents/original.txt', 'documents/copy.txt')
        expect(await storage.get('documents/copy.txt')).toBe('hello flydrive')

        await storage.move('documents/copy.txt', 'archive/moved.txt')
        expect(await storage.exists('documents/copy.txt')).toBe(false)
        expect(await storage.get('archive/moved.txt')).toBe('hello flydrive')

        await storage.delete('documents/original.txt')
        expect(await storage.exists('documents/original.txt')).toBe(false)
    })

    it('keeps files isolated between local disks', async () => {
        const storage = makeStorage()

        await storage.put('shared-name.txt', 'local contents')
        await storage.disk('public').put('shared-name.txt', 'public contents')

        expect(await storage.get('shared-name.txt')).toBe('public contents')
        expect(await storage.disk('local').get('shared-name.txt')).toBe('local contents')
    })

    it('resolves configured custom drivers through the same manager API', async () => {
        values.filesystem.default = 'memory'
        values.filesystem.disks.memory = { driver: 'memory' }
        values.filesystem.custom_drivers = { memory: driver }

        const storage = makeStorage()

        expect(storage.getDiskName()).toBe('memory')
        expect(storage.getDriverName()).toBe('memory')
        expect(await storage.get('demo.jpg')).toBe('custom driver contentdemo.jpg')
    })

    it('creates the built-in GCS driver from configured client options', () => {
        const storageClient = {
            bucket: () => ({})
        }

        const gcs = Driver.make({
            driver: 'gcs',
            storage: storageClient,
            bucket: 'uploads',
            visibility: 'private',
            usingUniformAcl: true,
        })

        expect(gcs).toBeInstanceOf(GCSDriver)
        expect((gcs as any).options).toMatchObject({
            storage: storageClient,
            bucket: 'uploads',
            visibility: 'private',
            usingUniformAcl: true,
        })
    })
})
