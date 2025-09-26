#!/usr/bin/env node

import { FileSystem } from '@h3ravel/shared'
import { execa } from 'execa'
import { join } from 'node:path'
import preferredPM from 'preferred-pm'

const build = async () => {
    const pm = (await preferredPM(process.cwd()))?.name ?? 'npm'
    const outDir = join(process.env.DIST_DIR ?? '.h3ravel/serve')

    if (await FileSystem.fileExists(outDir)) return

    const ENV_VARS = {
        EXTENDED_DEBUG: 'false',
        CLI_BUILD: 'true',
        NODE_ENV: 'production',
        DIST_DIR: outDir,
        LOG_LEVEL: 'silent'
    }

    await execa(
        pm,
        ['tsdown', '--silent', '--config-loader', 'unconfig', '-c', 'tsdown.default.config.ts'].filter(e => e !== null),
        { stdout: 'inherit', stderr: 'inherit', cwd: join(process.cwd()), env: Object.assign({}, process.env, ENV_VARS) }
    )
}

build()
