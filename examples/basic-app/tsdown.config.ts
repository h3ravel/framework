import { defineConfig } from 'tsdown';
import run from '@rollup/plugin-run';

const env = process.env.NODE_ENV || 'development';
const outDir = env === 'development' ? '.h3ravel/serve' : 'dist'

export default defineConfig({
    outDir,
    entry: ['src/**/*.ts'],
    format: ['esm', 'cjs'],
    target: 'node22',
    sourcemap: env === 'development',
    clean: true,
    shims: true,
    copy: [{ from: 'public', to: outDir }, 'src/resources', 'src/database'],
    env: env === 'development' ? {
        NODE_ENV: env,
        SRC_PATH: outDir,
    } : {},
    watch:
        env === 'development'
            ? ['.env', '.env.*', 'src', '../../packages']
            : false,
    hooks (hooks) {
        hooks.hook('build:done', () => {
        })
    },
    dts: false,
    logLevel: 'silent',
    nodeProtocol: true,
    skipNodeModulesBundle: true,
    plugins: env === 'development' ? [
        run({
            env: Object.assign({}, process.env, {
                NODE_ENV: env,
                SRC_PATH: outDir,
            }),
            execArgv: ['-r', 'source-map-support/register'],
            allowRestarts: false,
            input: process.cwd() + '/src/server.ts'//
        })
    ] : [],
});
