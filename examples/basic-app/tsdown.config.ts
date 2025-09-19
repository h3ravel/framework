import { defineConfig } from 'tsdown';

const env = process.env.NODE_ENV || 'development';
const postCmd =
    env === 'development'
        ? `&& NODE_ENV=${env} SRC_PATH=dist node -r tsconfig-paths/register dist/server.js`
        : '';

export default defineConfig({
    entry: ['src/**/*.ts'],
    format: ['esm', 'cjs'],
    target: 'node22',
    sourcemap: env === 'development',
    clean: true,
    shims: true,
    copy: [{ from: 'public', to: 'dist' }],
    watch:
        env === 'development'
            ? ['.env', '.env.*', 'src/**/*.*', '../../packages/**/src/**/*.*']
            : false,
    onSuccess: `cp -r ./src/resources ./dist && cp -r ./src/database ./dist ${postCmd}`,
    hooks (hooks) {
        hooks.hook('build:done', () => {
            // console.log('Hello World')
        })
    },
    dts: false,
    logLevel: 'silent',
    nodeProtocol: true,
    skipNodeModulesBundle: true,
});
