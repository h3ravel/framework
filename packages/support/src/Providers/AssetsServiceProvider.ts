import { readFile, stat } from 'node:fs/promises'

import { ServiceProvider } from '../Providers/ServiceProvider'
import { Str } from '../Helpers/Str'
import { join } from 'node:path'
import { serveStatic } from 'h3'
import { statSync } from 'node:fs'

/**
 * Handles public assets loading
 * 
 * Auto-Registered
 */
export class AssetsServiceProvider extends ServiceProvider {
    public static priority = 996

    register () {
        const app = this.app.make('router')
        const publicPath = this.app.getPath('public')

        /**
         * Use a middleware to check if this request for for a file
         */
        app.h3middleware((event) => {
            const { pathname } = new URL(event.req.url)

            /**
             * Only serve if it looks like a static asset (has an extension)
             * but skip dotfiles or sensitive files
             */
            if (!/\.[a-zA-Z0-9]+$/.test(pathname)) return
            if (pathname.startsWith('/.') || pathname.includes('..')) return

            /**
             * Serve the asset
             */
            return serveStatic(event, {
                indexNames: ['/index.html'],
                getContents: (id) => {
                    return <never>readFile(join(Str.before(publicPath, id), id))
                },
                getMeta: async (id) => {
                    const stats = await stat(join(Str.before(publicPath, id), id)).catch(() => { })
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
            return (key: string, def?: string) => {
                if (def) {
                    try {
                        statSync(join(Str.before(publicPath, key), key))
                    } catch {
                        key = def
                    }
                }

                return key
            }
        })
    }
}
