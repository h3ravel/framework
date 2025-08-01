// vite.base.config.ts
import type { Options } from 'tsup'

const baseConfig: Options = {
    entry: ['src/index.ts'],
    format: ['esm', 'cjs'],
    dts: true,
    sourcemap: true,
    clean: true
}

export default baseConfig
