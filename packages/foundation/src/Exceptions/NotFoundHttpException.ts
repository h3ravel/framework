import { HttpExceptionFactory } from './Base/HttpExceptionFactory'

export class NotFoundHttpException extends HttpExceptionFactory {
    constructor(
        message: string = '',
        previous?: Error,
        code: number = 0,
        headers: Record<string, string> = {},
    ) {
        super(404, message, previous, headers, code)
    }
}