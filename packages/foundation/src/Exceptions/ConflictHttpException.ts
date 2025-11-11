import { HttpExceptionFactory } from './HttpExceptionFactory'

export class ConflictHttpException extends HttpExceptionFactory {
    constructor(
        message: string = '',
        previous?: Error,
        code: number = 0,
        headers: Record<string, string> = {},
    ) {
        super(409, message, previous, headers, code)
    }
}