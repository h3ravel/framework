import { baseConfig } from '../../tsdown.config';
import { defineConfig } from 'tsdown';

export default defineConfig([
  {
    ...baseConfig,
    onSuccess: undefined,
    format: ['esm', 'cjs'],
    entry: ['src/index.ts', 'src/Utils.ts'],
    sourcemap: false,
    target: "node22",
    platform: 'node',
  },
  {
    format: ['esm', 'cjs'],
    entry: ['src/fire.ts'],
    treeshake: true,
    outDir: 'bin',
    minify: true,
    external: baseConfig.external
  }
]);
