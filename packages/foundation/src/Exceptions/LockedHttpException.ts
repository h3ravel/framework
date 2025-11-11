import { HttpExceptionFactory } from './HttpExceptionFactory'

export class LockedHttpException extends HttpExceptionFactory {
    constructor(
        message: string = '',
        previous?: Error,
        code: number = 0,
        headers: Record<string, string> = {},
    ) {
        super(423, message, previous, headers, code)
    }
}