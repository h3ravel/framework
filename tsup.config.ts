import { defineConfig } from 'tsup'

export default defineConfig({
    dts: true,
    clean: true,
    entry: ['src/index.ts'],
    format: ['esm', 'cjs'],
    sourcemap: true,
    external: [
        'fs',
        'path',
        'os',
        'dotenv',
        'crypto',
        'fs-readdir-recursive',
        /.*\/promises$/gi,
        /^node:.*/gi
    ],
}) 
