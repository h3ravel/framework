import { baseConfig } from '../../tsdown.config'
import { defineConfig } from 'tsdown';

export default defineConfig({
    ...baseConfig,
    entry: ['src/index.ts'],
    onSuccess: `cp -r ./src/stubs ./dist`,
});
