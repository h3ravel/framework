import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'

import { importFile, PathLoader } from '../src'

const originalEnvironment = process.env.NODE_ENV
const originalDistDirectory = process.env.DIST_DIR
const temporaryDirectories: string[] = []

afterEach(async () => {
    if (originalEnvironment === undefined) {
        delete process.env.NODE_ENV
    } else {
        process.env.NODE_ENV = originalEnvironment
    }

    if (originalDistDirectory === undefined) {
        delete process.env.DIST_DIR
    } else {
        process.env.DIST_DIR = originalDistDirectory
    }

    await Promise.all(temporaryDirectories.splice(0).map(directory => (
        rm(directory, { recursive: true, force: true })
    )))
})

describe('application file imports', () => {
    it('transpiles TypeScript files directly', async () => {
        const directory = await mkdtemp(path.join(tmpdir(), 'h3ravel-import-'))
        temporaryDirectories.push(directory)

        const sourceFile = path.join(directory, 'config.ts')
        await writeFile(sourceFile, 'export default { runtime: "typescript" } as const')

        const module = await importFile<{ default: { runtime: string } }>(sourceFile)

        expect(module.default.runtime).toBe('typescript')
    })

    it('uses the native module cache for JavaScript files', async () => {
        const directory = await mkdtemp(path.join(tmpdir(), 'h3ravel-native-import-'))
        temporaryDirectories.push(directory)

        const sourceFile = path.join(directory, 'contract.mjs')
        await writeFile(sourceFile, 'export class Contract {}')

        const nativeModule = await import(sourceFile)
        const importedModule = await importFile<{ Contract: new () => unknown }>(sourceFile)

        expect(importedModule.Contract).toBe(nativeModule.Contract)
    })

    it('resolves conventional application aliases without a tsconfig', async () => {
        const directory = await mkdtemp(path.join(tmpdir(), 'h3ravel-alias-'))
        temporaryDirectories.push(directory)

        await mkdir(path.join(directory, 'src'))
        await writeFile(path.join(directory, 'package.json'), '{"private":true}')
        await writeFile(path.join(directory, 'tsconfig.json'), '{"extends":"./missing.json"}')
        await writeFile(path.join(directory, 'src/helper.ts'), 'export const value = "aliased"')
        await writeFile(
            path.join(directory, 'entry.ts'),
            'import { value } from "src/helper"; export default value',
        )

        const module = await importFile<{ default: string }>(path.join(directory, 'entry.ts'))

        expect(module.default).toBe('aliased')
    })

    it('keeps source paths in development', () => {
        process.env.NODE_ENV = 'development'
        process.env.DIST_DIR = '.h3ravel/serve'

        const paths = new PathLoader()

        expect(paths.getPath('config', '/project')).toBe(path.normalize('/project/src/config'))
        expect(paths.distPath('/project/src/routes/web.ts')).toBe(
            path.normalize('/project/src/routes/web.ts'),
        )
    })

    it('maps source paths to build artifacts in production', () => {
        process.env.NODE_ENV = 'production'
        process.env.DIST_DIR = 'build'

        const paths = new PathLoader()

        expect(paths.getPath('config', '/project')).toBe(path.normalize('/project/build/config'))
        expect(paths.distPath('/project/src/routes/web.ts')).toBe(
            path.normalize('/project/build/routes/web.js'),
        )
    })
})
