import { baseConfig } from '../../tsdown.config'
import { defineConfig } from 'tsdown'

export default defineConfig([
  {
    outExtensions: baseConfig.outExtensions,
    dts: false,
    format: ['esm'],
    entry: ['src/fire.ts', 'src/prepare.ts'],
    treeshake: true,
    outDir: 'bin',
    minify: true,
    external: baseConfig.external
  },
  {
    ...baseConfig,
    format: ['esm', 'cjs'],
    entry: ['src/index.ts'],
    target: 'node22',
    platform: 'node',
  },
])
