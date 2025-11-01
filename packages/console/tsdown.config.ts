import { baseConfig } from '../../tsdown.config'
import { defineConfig } from 'tsdown'

export default defineConfig([
  {
    ...baseConfig,
    format: ['esm', 'cjs'],
    entry: ['src/index.ts', 'src/Utils.ts'],
    sourcemap: true,
    target: 'node22',
    platform: 'node',
  },
  {
    format: ['esm', 'cjs'],
    entry: ['src/fire.ts', 'src/prepare.ts'],
    treeshake: true,
    outDir: 'bin',
    minify: true,
    external: baseConfig.external
  }
])
