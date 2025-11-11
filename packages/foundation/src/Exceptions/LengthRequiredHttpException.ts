import { HttpExceptionFactory } from './HttpExceptionFactory'

export class LengthRequiredHttpException extends HttpExceptionFactory {
    constructor(
        message: string = '',
        previous?: Error,
        code: number = 0,
        headers: Record<string, string> = {},
    ) {
        super(411, message, previous, headers, code)
    }
}