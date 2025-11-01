import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { mkdtemp, readFile, rmdir, writeFile } from 'node:fs/promises'

import { Application } from '@h3ravel/core'
import { Kernel } from '@h3ravel/musket'
import { KeyGenerateCommand } from '../src'
import dotenv from 'dotenv'
import path from 'node:path'
import { tmpdir } from 'node:os'

let tempPath: string
let kernel: Kernel
let app: Application

console.log = vi.fn(() => 0)

beforeAll(async () => {
    tempPath = await mkdtemp(path.join(tmpdir(), '@h3ravel-console'))
    globalThis.base_path = (file?: string) => path.join(tempPath, file ?? '')

    app = new Application(tempPath)
    kernel = new Kernel(app)

    await writeFile(base_path('.env'), '', 'utf8')
})

afterAll(async () => {
    await rmdir(tempPath, { recursive: true })
})

describe('key:generate command', () => {
    it('generates the application key', async () => {
        await new KeyGenerateCommand(app, kernel).handle()
        const buf = Buffer.from(await readFile(base_path('.env'), 'utf8'))
        const env = dotenv.parse(buf)
        expect(env.APP_KEY).toBeTruthy()
    })
})