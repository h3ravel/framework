import { HttpExceptionFactory } from './HttpExceptionFactory'

export class PreconditionRequiredHttpException extends HttpExceptionFactory {
    constructor(
        message: string = '',
        previous?: Error,
        code: number = 0,
        headers: Record<string, string> = {},
    ) {
        super(428, message, previous, headers, code)
    }
}