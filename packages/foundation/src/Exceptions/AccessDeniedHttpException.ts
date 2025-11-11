import { HttpExceptionFactory } from './HttpExceptionFactory'

export class AccessDeniedHttpException extends HttpExceptionFactory {
    constructor(
        message: string = '',
        previous?: Error,
        code: number = 0,
        headers: Record<string, string> = {},
    ) {
        super(403, message, previous, headers, code)
    }
}