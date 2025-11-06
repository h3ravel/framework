import { baseConfig } from '../../tsdown.config'
import { defineConfig } from 'tsdown'

export default defineConfig([
  {
    ...baseConfig,
    exports: {
      customExports (exports) {
        return Object.assign({}, exports, { './tsconfig.json': './tsconfig.json' })
      },
    },
    format: ['esm', 'cjs'],
    entry: ['src/index.ts'],
    sourcemap: true,
    target: 'node22',
    platform: 'node',
  },
])
