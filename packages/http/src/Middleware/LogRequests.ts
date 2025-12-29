import { IRequest, IResponse } from '@h3ravel/contracts'

import { Injectable } from '@h3ravel/foundation'
import { Logger } from '@h3ravel/shared'
import { Middleware } from '../Middleware'

export class LogRequests extends Middleware {
    @Injectable()
    async handle (request: IRequest, response: IResponse, next: (request: IRequest) => Promise<unknown>): Promise<unknown> {
        const _next = await next(request)

        const code = Number(response.getStatusCode())
        const method = request.method().toLowerCase()
        let color = 'bgRed'

        if (code < 200) color = 'bgWhite'
        else if (code >= 200 && code <= 300) color = 'bgBlue'
        else if (code >= 300 && code <= 400) color = 'bgOrange'

        let mColor = 'bgYellow'
        if (method == 'get') mColor = 'bgBlue'
        else if (method == 'head') mColor = 'bgGray'
        else if (method == 'delete') mColor = 'bgRed'

        Logger.log([
            [` ${method.toUpperCase()} `, mColor as never],
            [request.fullUrl(), 'white'],
            ['→', 'blue'],
            [` ${code} `, color as never]
        ], ' ')

        return _next
    }
}
