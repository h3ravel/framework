import { baseConfig } from '../../tsdown.config'
import { defineConfig } from 'tsdown'

export default defineConfig([
  {
    ...baseConfig,
    exports: {
      customExports (exports) {
        return Object.assign({}, exports, { './tsconfig.base.json': './tsconfig.base.json' })
      },
    },
    format: ['esm', 'cjs'],
    entry: ['src/index.ts'],
    sourcemap: false,
    target: 'node22',
    platform: 'node',
  },
])
