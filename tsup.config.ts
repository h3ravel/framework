import { defineConfig } from 'tsup'

export default defineConfig({
    entry: ['src/index.ts'],
    format: ['esm', 'cjs'],
    dts: true,
    sourcemap: true,
    external: [
        'fs',
        'path',
        'os',
        'dotenv'
    ],
    clean: true
}) 
