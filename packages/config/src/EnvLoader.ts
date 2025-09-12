import { DotNestedKeys, DotNestedValue, safeDot } from '@h3ravel/support'

import { Application } from '@h3ravel/core'
import { EnvParser } from '@h3ravel/shared'

export class EnvLoader {
    constructor(protected _app: Application) { }

    /**
     * Get the defined environment vars
     */
    get<X extends NodeJS.ProcessEnv> (): X
    get<X extends NodeJS.ProcessEnv, K extends DotNestedKeys<X>> (key: K, def?: any): DotNestedValue<X, K>
    get<X extends NodeJS.ProcessEnv, K extends DotNestedKeys<X>> (key?: K, def?: any): any {
        return safeDot(EnvParser.parse(process.env), key) ?? def
    }
}
