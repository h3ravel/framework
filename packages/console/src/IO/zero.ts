import { FileSystem, mainTsconfig } from '@h3ravel/shared'
import { mkdir, writeFile } from 'node:fs/promises'
import path, { join } from 'node:path'

import { execa } from 'execa'
import { existsSync } from 'node:fs'
import preferredPM from 'preferred-pm'

export default class {
    /**
     * Ensures that the app is pre built
     * 
     * @returns 
     */
    async prepare (DIST_DIR = '.h3ravel/serve') {
        const pm = (await preferredPM(process.cwd()))?.name ?? 'npm'
        const outDir = join(process.env.DIST_DIR ?? DIST_DIR)

        if (!existsSync(path.join(outDir.replace('/serve', '')))) {
            await mkdir(path.join(outDir.replace('/serve', '')), { recursive: true })
        }

        if (!await FileSystem.fileExists(path.join(outDir, 'tsconfig.json'))) {
            await writeFile(path.join(outDir.replace('/serve', ''), 'tsconfig.json'), JSON.stringify(mainTsconfig, null, 2))
        }

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
}
