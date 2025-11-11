import { type UserConfig, defineConfig } from 'tsdown'
import { copyFile, glob, mkdir, readFile, writeFile } from 'node:fs/promises'

import path from 'node:path'
import { exists, findUpConfig } from './utils/fs'

export const baseConfig: UserConfig = {
    dts: true,
    clean: true,
    shims: true,
    unbundle: false,
    entry: ['src/index.ts'],
    format: ['esm', 'cjs'],
    sourcemap: false,
    exports: true,
    outExtensions: (e) => {
        return ({
            js: e.format === 'es' ? '.js' : '.cjs',
            dts: '.d.ts'
        })
    },
    hooks (hooks) {
        hooks.hook('build:done', async (ctx) => {
            try {
                // Get the absolute output directory
                const outDir = ctx.options.outDir ?? 'dist'
                // Get the absolute base directory
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
                    // Augment the d.ts file to the index.d.ts
                    if (entry.includes('.d.ts')) {
                        for await (const indexFile of glob(path.join(outDir, 'index.d.*ts'))) {
                            const reference = `/// <reference path="./${path.basename(entry)}" />\n`
                            if (await exists(indexFile)) {
                                let content = await readFile(indexFile, 'utf8')
                                // Only add if it’s not already there
                                if (!content.includes(reference.trim())) {
                                    content = reference + content
                                    await writeFile(indexFile, content, 'utf8')
                                }
                            }
                        }
                    }
                }
            } catch { /** */ }
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
        /^@h3ravel\/.*/gi,
        /^node:.*/gi,
        /.*\/promises$/gi,
        'fs-readdir-recursive',
    ],
}

export default defineConfig(baseConfig) 
