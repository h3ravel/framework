import { HttpExceptionFactory } from './Base/HttpExceptionFactory'

export class TooManyRequestsHttpException extends HttpExceptionFactory {
    /**
     * 
     * @param retryAfter The number of seconds or HTTP-date after which the request may be retried
     * @param message 
     * @param previous 
     * @param code 
     * @param headers 
     */
    constructor(
        retryAfter?: number | string,
        message: string = '',
        previous?: Error,
        code: number = 0,
        headers: Record<string, string> = {},
    ) {
        super(429, message, previous, headers, code)

        if (retryAfter) {
            this.headers['Retry-After'] = String(retryAfter)
        }
    }
}