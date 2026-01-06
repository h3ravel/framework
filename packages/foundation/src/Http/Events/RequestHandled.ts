import { IRequest, IResponse } from '@h3ravel/contracts'

export class RequestHandled {
    /**
     * The request instance.
     */
    public request: IRequest

    /**
     * The response instance.
     */
    public response?: IResponse

    /**
     * Create a new event instance.
     *
     * @param  request
     * @param  response
     */
    constructor(request: IRequest, response?: IResponse) {
        this.request = request
        this.response = response
    }
}
