import { DotNestedKeys, DotNestedValue, safeDot, setNested } from '@h3ravel/support'

import { Application } from '@h3ravel/core'
import path from 'node:path'
import { readdir } from 'node:fs/promises'

export class ConfigRepository {
    private loaded: boolean = false
    private configs: Record<string, Record<string, any>> = {}

    constructor(protected app: Application) { }

    // get<X extends Record<string, any>> (): X
    // get<X extends Record<string, any>, T extends Extract<keyof X, string>> (key: T): X[T]

    /**
     * Get the defined configurations
     */
    get<X extends Record<string, any>> (): X
    get<X extends Record<string, any>, K extends DotNestedKeys<X>> (key: K, def?: any): DotNestedValue<X, K>
    get<X extends Record<string, any>, K extends DotNestedKeys<X>> (key?: K, def?: any): any {
        return safeDot(this.configs, key) ?? def
    }

    /**
     * Modify the defined configurations
     */
    set<T extends string> (key: T, value: any): void {
        setNested(this.configs, key, value)
    }

    async load () {
        if (!this.loaded) {
            const configPath = this.app.getPath('config')

            const files = await readdir(configPath);

            for (let i = 0; i < files.length; i++) {
                const configModule = await import(path.join(configPath, files[i]))
                const name = files[i].replaceAll(/.ts|js/g, '')
                if (typeof configModule.default === 'function') {
                    this.configs[name] = configModule.default(this.app)
                }
            }

            this.loaded = true
        }

        return this
    }
}
