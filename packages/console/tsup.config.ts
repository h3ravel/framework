import { defineConfig } from 'tsup';

export default defineConfig(() => [
    {
        format: ['esm', 'cjs'],
        entry: ['src/**/*.ts'],
    },
    {
        format: ['esm', 'cjs'],
        entry: ['src/run.ts'],
    }
]);
