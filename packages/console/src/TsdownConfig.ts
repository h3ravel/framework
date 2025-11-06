import { UserConfig } from 'tsdown'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { rm } from 'node:fs/promises'
import run from '@rollup/plugin-run'

const env = process.env.NODE_ENV || 'development'
let outDir = env === 'development' ? '.h3ravel/serve' : 'dist'
if (process.env.DIST_DIR) {
    outDir = process.env.DIST_DIR
}

export const TsDownConfig: UserConfig = {
    outDir,
    entry: ['src/**/*.ts'],
    format: ['esm'],//, 'cjs'],
    target: 'node22',
    sourcemap: env === 'development',
    minify: !!process.env.DIST_MINIFY,
    external: [
        /^@h3ravel\/.*/gi,
    ],
    clean: true,
    shims: true,
    copy: [{ from: 'public', to: outDir }, 'src/resources', 'src/database'],
    env: env === 'development' ? {
        NODE_ENV: env,
        DIST_DIR: outDir,
    } : {},
    watch:
        env === 'development' && process.env.CLI_BUILD !== 'true'
            ? ['.env', '.env.*', 'src', '../../packages']
            : false,
    dts: false,
    logLevel: 'silent',
    nodeProtocol: true,
    skipNodeModulesBundle: true,
    hooks (e) {
        e.hook('build:done', async () => {
            const paths = ['database/migrations', 'database/factories', 'database/seeders']
            for (let i = 0; i < paths.length; i++) {
                const name = paths[i]
                if (existsSync(path.join(outDir, name)))
                    await rm(path.join(outDir, name), { recursive: true })
            }
        })
    },
    plugins: env === 'development' && process.env.CLI_BUILD !== 'true' ? [
        run({
            env: Object.assign({}, process.env, {
                NODE_ENV: env,
                DIST_DIR: outDir,
            }),
            execArgv: ['-r', 'source-map-support/register'],
            allowRestarts: false,
            input: process.cwd() + '/src/server.ts'//
        })
    ] : [],
}

export default TsDownConfig
