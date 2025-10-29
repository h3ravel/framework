import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { mkdtemp, rmdir, writeFile } from 'node:fs/promises'

import { HashManager } from '../src'
import { Str } from '@h3ravel/support'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { tmpdir } from 'node:os'

let testConfig = `import { defineConfig } from '@h3ravel/hashing'

export default defineConfig({
    driver: 'bcrypt',
    bcrypt: {
        rounds: 12,
        verify: true,
        limit: null,
    },
    argon: {
        memory: 65536,
        threads: 1,
        time: 4,
        verify: true,
    },
})`

describe('Password Hashing', async () => {
    ['bcrypt', 'argon', 'argon2id'].forEach(driver => {
        describe(Str.apa(driver), async () => {
            let hash!: string
            let manager!: HashManager
            const pattern = {
                bcrypt: /^\$2[aby]?\$(\d+)\$/,
                argon: /^\$argon2i\$/,
                argon2id: /^\$argon2id\$/,
            }

            const baseTempPath = await mkdtemp(path.join(tmpdir(), '@h3ravel-hashing'))//
            const confPath = path.join(baseTempPath, 'hashing.config.ts')

            if (!existsSync(confPath)) {
                const pd = { argon: 'bcrypt', argon2id: 'argon' }

                testConfig = testConfig.replace(`driver: '${pd[<never>driver] ?? 'bcrypt'}',`, `driver: '${driver}',`)
                await writeFile(confPath, testConfig)
            }

            const config = (await import(confPath)).default

            beforeAll(async () => {
                manager = await new HashManager().init(baseTempPath)
                hash = await manager.make('password')
            })

            afterAll(async () => {
                await rmdir(baseTempPath, { recursive: true })
            })

            describe('Configuration', async () => {
                it('can load file based configuration', () => {
                    expect(manager.config.driver).toBe(config.driver)
                })
            })

            describe('Hashing', () => {
                it('can correctly hash passwords', async () => {
                    expect(hash).toMatch(pattern[driver as never])
                })

                it('can verify hashed passwords', async () => {
                    expect(await manager.check('password', hash)).toBe(true)
                })

                it('will fail when wrong password is provided', async () => {
                    expect(await manager.check('wrong-password', hash)).toBe(false)
                })

                it('can retrieve information about hash', async () => {
                    expect(manager.info(hash).algoName).toBe(config.driver)
                })

                it('can check if password needs to be rehashed', async () => {
                    expect(manager.needsRehash(hash)).toBe(false)
                    expect(manager.needsRehash('hash')).toBe(true)
                })

                it('can verify hash', () => {
                    expect(manager.verifyConfiguration(hash)).toBe(true)
                    expect(manager.verifyConfiguration('hash')).toBe(false)
                })
            })
        })
    })


    describe('No Config File', async () => {
        let hash!: string
        let manager!: HashManager

        beforeAll(async () => {
            manager = await new HashManager().init()
            hash = await manager.make('password')
        })

        describe('Configuration', async () => {
            it('configuration should be undefined', () => {
                expect(manager.config.driver).toBeUndefined()
            })
        })

        describe('Hashing', () => {
            it('defaults to bcrypt and can correctly hash passwords', async () => {
                expect(hash).toMatch(/^\$2[aby]?\$(\d+)\$/)
            })
        })

        it('can verify hashed passwords', async () => {
            expect(await manager.check('password', hash)).toBe(true)
        })
    })
}) 
