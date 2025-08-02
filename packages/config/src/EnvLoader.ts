import { DotNestedKeys, DotNestedValue, safeDot } from '@h3ravel/support'

import { Application } from "@h3ravel/core";

export class EnvLoader {
    constructor(private _app: Application) { }

    /**
     * Get the defined environment vars
     */
    get<X extends NodeJS.ProcessEnv> (): X
    get<X extends NodeJS.ProcessEnv, K extends DotNestedKeys<X>> (key: K, def?: any): DotNestedValue<X, K>
    get<X extends NodeJS.ProcessEnv, K extends DotNestedKeys<X>> (key?: K, def?: any): any {
        return safeDot(process.env, key) ?? def
    }
}
