import { IRequest, IResponsable, IResponse } from '@h3ravel/contracts'

import { HTTPResponse } from 'h3'
import { Response } from '../Response'

export class Responsable extends IResponsable {
    toResponse (request: IRequest): IResponse {
        return new Response(
            request.app,
            this.body as string,
            this.status,
            Object.fromEntries(this.headers.entries())
        )
    }
    HTTPResponse (): HTTPResponse {
        return super.constructor as unknown as HTTPResponse
    }
}