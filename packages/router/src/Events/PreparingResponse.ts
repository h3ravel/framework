import { IRequest, ResponsableType } from '@h3ravel/contracts'

export class PreparingResponse {
    /**
     * Create a new event instance.
     *
     * 
     * @param $request  The request instance.
     * @param $response  The response instance.
     */
    constructor(
        public request: IRequest,
        public response: ResponsableType,
    ) {
    }
}
