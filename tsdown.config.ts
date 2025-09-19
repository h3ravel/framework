import { Options, defineConfig } from 'tsdown'
import { copyFile, glob } from 'node:fs/promises'

import escalade from 'escalade/sync'
import { existsSync } from 'node:fs'
import path from 'node:path'

function findUpConfig (base: string, name: string, extensions: string[]) {
    return escalade(process.cwd(), (_dir) => {
        for (const ext of extensions) {
            const filename = path.join(_dir, base, name + '.' + ext)
            if (existsSync(filename)) {
                return filename
            }
        }
        return ''
    })!
}

export const baseConfig: Options = {
    dts: true,
    clean: true,
    shims: false,
    entry: ['src/index.ts'],
    format: ['esm', 'cjs'],
    sourcemap: true,
    async onSuccess () {
        try {
            const base = findUpConfig('framework', 'package', ['json'])
            const ptrn = base.replace('package.json', 'packages/**/src/*.d.ts')

            for await (const entry of glob(ptrn)) {
                if (existsSync(entry) && existsSync(entry.replace('src', 'dist')))
                    setTimeout(() => copyFile(entry, entry.replace('src', 'dist')), 3000)
            }
        } catch { /** */ }
    },
    hooks (hooks) {
        hooks.hook('build:done', () => {
            // console.log('Hello World')
        })
    },
    external: [
        'fs',
        'os',
        'tsx',
        'path',
        'tsdown',
        'dotenv',
        'crypto',
        'rollup',
        'esbuild',
        'edge.js',
        'nodemailer',
        'typescript',
        /^node:.*/gi,
        /.*\/promises$/gi,
        'fs-readdir-recursive',
    ],
}

export default defineConfig(baseConfig) 
