import { type Options, defineConfig } from 'tsdown'
import { copyFile, glob, mkdir } from 'node:fs/promises'

import path from 'node:path'
import { exists, findUpConfig } from './utils/fs'

export const baseConfig: Options = {
    dts: true,
    clean: true,
    shims: true,
    entry: ['src/index.ts'],
    format: ['esm', 'cjs'],
    sourcemap: true,
    hooks (hooks) {
        hooks.hook('build:done', async (ctx) => {
            // Get the absolute base path
            const base = await findUpConfig('framework', 'package', ['json'])
            if (!base) return
            // Make globale DTS partern
            const gdts = base.replace('package.json', 'packages/**/src/*.d.ts')
            // Make globale stubs partern
            const stubs = base.replace('package.json', 'packages/**/src/**/*.stub')

            for await (const entry of glob([gdts, stubs])) {
                const target = entry.replace('src', 'dist')
                // Ensure the target dir exists
                if (await exists(entry) && !await exists(path.dirname(target)))
                    await mkdir(path.dirname(target))
                // Copy required files only for current package
                if (await exists(entry) && entry.includes(ctx.options.cwd))
                    copyFile(entry, target)
            }
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
