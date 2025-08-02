import { Bindings, ServiceProvider } from '@h3ravel/core'

import path from 'node:path'
import { readdir } from 'node:fs/promises'
import { safeDot } from '@h3ravel/support'

/**
 * Loads configuration and environment files.
 * 
 * Load .env and merge with config files.
 * Bind ConfigRepository to the container.
 * 
 * Auto-Registered
 */
export class ConfigServiceProvider extends ServiceProvider {
    async register () {
        this.app.singleton('env', () => {
            return (<T extends string> (key?: T, def?: string) => {
                if (key) {
                    return process.env[key] ?? def ?? null
                }
                return process.env as Record<string, string | null | undefined>
            }) as Bindings['env']
        })


        const configPath = this.app.getPath('config')
        const configs: Record<string, Record<string, any>> = {};
        const files = await readdir(configPath);

        for (let i = 0; i < files.length; i++) {
            const configModule = await import(path.join(configPath, files[i]))
            const name = files[i].replaceAll(/.ts|js/g, '')
            if (typeof configModule.default === 'function') {
                configs[name] = configModule.default(this.app)
            }
        }

        this.app.singleton('config', () => {
            return {
                get: (key) => safeDot(configs, key),
                set: (_key, _value) => { }
            } as Bindings['config']
        })
    }
}
