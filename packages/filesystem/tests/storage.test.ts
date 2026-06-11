// import { afterAll, beforeAll } from 'vitest'
import { describe, expect, it } from 'vitest'

// import { Driver } from '../src/Driver'
import { Storage } from '../src/Facades'
// import dotenv from 'dotenv'
import { driver } from './helpers'

// import { dirname, resolve } from 'node:path'

// import { fileURLToPath } from 'node:url'

// import { h3ravel } from '@h3ravel/core'

// const __dirname = dirname(fileURLToPath(import.meta.url))

describe.skip('Filesystem Storage', () => {
    // beforeAll(async () => {
    //     dotenv.populate(process.env, { CONFIG_PATH: resolve(__dirname, './config') })
    //     h3ravel.setRootDir(resolve(__dirname, './'))
    // })

    // afterAll(() => {
    //     dotenv.populate(process.env, { CONFIG_PATH: undefined })
    // })

    describe('Storage System', () => {
        it('should set the configured disk and driver', () => {
            const file = Storage.disk('public')

            expect(file.getDiskName()).toBe('public')
            expect(file.getDriverName()).toBe('local')
        })
    })

    describe('Custom Driver', () => {
        // it('should resolve a registered custom disk driver', () => {

        //     Driver.registerDriver('memory', driver)

        //     expect(Driver.make({ driver: 'memory' } as never)).toBe(driver)

        //     Driver.removeDriver('memory')
        // })

        it('should resolve a configured custom disk driver', async () => {
            config({
                'filesystem.default': 'memory',
                'filesystem.custom_drivers.memory': driver,
                'filesystem.disks.memory': { driver: 'memory' },
            } as never)

            expect(await Storage.get('demo.jpg')).toBe('custom driver contentdemo.jpg')
        })
    })
})
