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
    deps: {
      neverBundle: baseConfig.deps?.neverBundle
    }
  },
  {
    ...baseConfig,
    entry: ['src/index.ts'],
    target: 'node22',
    platform: 'node',
  },
])
