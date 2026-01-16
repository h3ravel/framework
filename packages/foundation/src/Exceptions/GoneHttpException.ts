import { HttpExceptionFactory } from './Base/HttpExceptionFactory'

export class GoneHttpException extends HttpExceptionFactory {
    constructor(
        message: string = '',
        previous?: Error,
        code: number = 0,
        headers: Record<string, string> = {},
    ) {
        super(410, message, previous, headers, code)
    }
}