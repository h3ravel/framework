import { defineConfig } from 'tsup';

const env = process.env.NODE_ENV || 'development'
const postCmd = env === 'development'
    ? `&& NODE_ENV=${env} SRC_PATH=dist node -r tsconfig-paths/register dist/server.js`
    : undefined

export default defineConfig((options) => [
    {
        entry: ['src/**/*.ts'],
        format: ['esm'],
        target: 'node22',
        sourcemap: env === 'development',
        clean: true,
        shims: true,
        publicDir: true,
        watch: env === 'development' ? ['.env', '.env.*', 'src/**/*.*', '../../packages/**/src/**/*.*'] : false,
        onSuccess: `cp -r ./src/resources ./dist && cp -r ./src/database ./dist ${postCmd}`,
        dts: true,
        silent: true,
        skipNodeModulesBundle: true,
    }
]);
