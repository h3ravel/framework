import { baseConfig } from '../../tsdown.config'
import { defineConfig } from 'tsdown'

export default defineConfig({
  ...baseConfig,
  format: ['esm', 'cjs'],
  entry: ['src/index.ts'],
  sourcemap: true,
  target: 'node22',
  platform: 'node',
})