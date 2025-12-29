import { IApplication, IMiddleware } from '@h3ravel/contracts'

import { Injectable } from '@h3ravel/foundation'

@Injectable()
export abstract class Middleware extends IMiddleware {
    constructor(protected app: IApplication) {
        super()
    }
}
