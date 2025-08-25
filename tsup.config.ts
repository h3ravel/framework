import { copyFile, glob } from 'node:fs/promises'

import { defineConfig } from 'tsup'
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

export default defineConfig({
    dts: true,
    clean: true,
    entry: ['src/index.ts'],
    format: ['esm', 'cjs'],
    sourcemap: true,
    async onSuccess () {
        const base = findUpConfig('framework', 'package', ['json'])
        const ptrn = base.replace('package.json', 'packages/**/src/*.d.ts')
        for await (const entry of glob(ptrn))
            setTimeout(() => copyFile(entry, entry.replace('src', 'dist')), 3000)

    },
    external: [
        'fs',
        'path',
        'os',
        'dotenv',
        'crypto',
        'fs-readdir-recursive',
        /.*\/promises$/gi,
        /^node:.*/gi,
        'edge.js',
        'nodemailer',
        'fs-readdir-recursive',
    ],
}) 
