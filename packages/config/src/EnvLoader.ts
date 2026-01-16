import type { DotNestedKeys, DotNestedValue } from '@h3ravel/shared'

import { EnvParser } from '@h3ravel/shared'
import { IApplication } from '@h3ravel/contracts'
import { safeDot } from '@h3ravel/support'

export class EnvLoader {
    constructor(protected app?: IApplication) { }

    /**
     * Get the defined environment vars
     */
    get<X extends NodeJS.ProcessEnv> (): X
    get<X extends NodeJS.ProcessEnv, K extends DotNestedKeys<X>> (key: K, def?: any): DotNestedValue<X, K>
    get<X extends NodeJS.ProcessEnv, K extends DotNestedKeys<X>> (key?: K, def?: any): any {
        return safeDot(EnvParser.parse(process.env), key) ?? def
    }
}
