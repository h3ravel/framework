import { defineConfig } from 'tsup';

const env = process.env.NODE_ENV || 'development'
const postCmd = env === 'development'
    ? `&& NODE_ENV=${env} node -r tsconfig-paths/register src/server.ts`
    : `&& NODE_ENV=${env} SRC_PATH=dist node -r tsconfig-paths/register dist/server.js`
console.log(env, '==============')
export default defineConfig({
    entry: ['src/**/*.ts'],
    format: ['esm'],
    target: 'esnext',
    sourcemap: true,
    clean: true,
    watch: env === 'development',
    onSuccess: `cp -r ./src/resources ./dist ${postCmd}`,
    dts: true,
    skipNodeModulesBundle: true,
});
