import { baseConfig } from '../../tsup.config';
import { defineConfig } from 'tsup';

export default defineConfig(() => [
    {
        ...baseConfig,
        onSuccess: undefined,
        format: ['esm', 'cjs'],
        entry: ['src/index.ts', 'src/Utils.ts'],
    },
    {
        format: ['esm', 'cjs'],
        entry: ['src/fire.ts'],
        treeshake: true,
        outDir: 'bin',
        minify: true,
    }
]);
