import { defineConfig } from 'tsup';

export default defineConfig((options) => [
    {
        entry: ['src/**/*.ts'],
        onSuccess: `cp -r ./src/stubs ./dist`,
    }
]);
