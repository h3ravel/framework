import { readFile, stat } from 'node:fs/promises'

import { ServiceProvider } from '@h3ravel/core'
import { before } from '@h3ravel/support'
import { join } from 'node:path'
import { serveStatic } from 'h3'
import { statSync } from 'node:fs'

/**
 * Handles public assets loading
 * 
 * Auto-Registered
 */
export class AssetsServiceProvider extends ServiceProvider {
    register () {
        const app = this.app.make('router')
        const config = this.app.make('config')
        const fsconfig = config.get('filesystem')
        const publicPath = this.app.getPath('public')

        app.middleware(`/${fsconfig.public_mask}/**`, (event) => {
            return serveStatic(event, {
                indexNames: ['/index.html'],
                getContents: (id) => {
                    const newId = id.replace(`/${fsconfig.public_mask}/`, '')
                    return readFile(join(before(publicPath, newId), newId))
                },
                getMeta: async (id) => {
                    const newId = id.replace(`/${fsconfig.public_mask}/`, '')
                    const stats = await stat(join(before(publicPath, newId), newId)).catch(() => { })
                    if (stats?.isFile()) {
                        return {
                            size: stats.size,
                            mtime: stats.mtimeMs,
                        }
                    }
                },
            })
        })

        this.app.singleton('asset', () => {
            return (key: string, def = '') => {
                try {
                    statSync(join(before(publicPath, key), key))
                } catch {
                    key = def
                }

                return join(fsconfig.public_mask, key)
            }
        })
    }
}
