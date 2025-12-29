import { HttpExceptionFactory } from './Base/HttpExceptionFactory'

export class NotAcceptableHttpException extends HttpExceptionFactory {
    constructor(
        message: string = '',
        previous?: Error,
        code: number = 0,
        headers: Record<string, string> = {},
    ) {
        super(406, message, previous, headers, code)
    }
}