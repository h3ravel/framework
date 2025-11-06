import { HttpResponse } from '../Utilities/HttpResponse'

export class HttpResponseException extends Error {
    /**
     * The underlying response instance.
     */
    protected response: HttpResponse

    /**
     * Create a new HTTP response exception instance.
     * 
     * @param response 
     * @param previous 
     */
    constructor(response: HttpResponse, previous?: Error) {
        super(previous?.message ?? '')
        this.name = 'HttpResponseException'
        this.response = response
    }

    /**
     * Get the underlying response instance.
     */
    public getResponse (): HttpResponse {
        return this.response
    }
}
