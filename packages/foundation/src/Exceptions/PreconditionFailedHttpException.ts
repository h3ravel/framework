import { HttpExceptionFactory } from './Base/HttpExceptionFactory'

export class PreconditionFailedHttpException extends HttpExceptionFactory {
    constructor(
        message: string = '',
        previous?: Error,
        code: number = 0,
        headers: Record<string, string> = {},
    ) {
        super(412, message, previous, headers, code)
    }
}