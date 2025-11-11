import { HttpExceptionFactory } from './HttpExceptionFactory'

export class BadRequestHttpException extends HttpExceptionFactory {
    constructor(
        message: string = '',
        previous?: Error,
        code: number = 0,
        headers: Record<string, string> = {},
    ) {
        super(400, message, previous, headers, code)
    }
}