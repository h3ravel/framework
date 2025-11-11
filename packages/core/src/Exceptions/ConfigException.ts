import { Logger } from '@h3ravel/shared'

export class ConfigException extends Error {
    key: string

    constructor(key: string, type: 'any' | 'config' | 'env' = 'config', cause?: unknown) {
        const info = {
            any: `${key} not configured.`,
            env: `${key} environment variable not configured.`,
            config: `${key} config not set.`,
        }

        const message = Logger.log([['ERROR:', 'bgRed'], [info[type], 'white']], ' ', false)

        super(message, {
            cause
        })

        this.key = key
    }
}
