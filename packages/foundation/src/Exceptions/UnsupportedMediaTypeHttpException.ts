import { HttpExceptionFactory } from './HttpExceptionFactory'

export class UnsupportedMediaTypeHttpException extends HttpExceptionFactory {
    constructor(
        message: string = '',
        previous?: Error,
        code: number = 0,
        headers: Record<string, string> = {},
    ) {
        super(415, message, previous, headers, code)
    }
}