import { readFile, stat } from "node:fs/promises";

import { ServiceProvider } from '@h3ravel/core'
import { before } from "@h3ravel/support";
import { join } from "node:path";
import { serveStatic } from 'h3'

/**
 * Handles public assets loading
 * 
 * Auto-Registered
 */
export class AssetsServiceProvider extends ServiceProvider {
    register () {
        const app = this.app.make('router')
        const publicPath = this.app.getPath('public')

        app.middleware('/assets/**', (event) => {
            return serveStatic(event, {
                indexNames: ["/index.html"],
                getContents: (id) => {
                    const newId = id.replace('/assets/', '')
                    return readFile(join(before(publicPath, newId), newId))
                },
                getMeta: async (id) => {
                    const newId = id.replace('/assets/', '')
                    const stats = await stat(join(before(publicPath, newId), newId)).catch(() => { });
                    if (stats?.isFile()) {
                        return {
                            size: stats.size,
                            mtime: stats.mtimeMs,
                        };
                    }
                },
            });
        })
    }
}
