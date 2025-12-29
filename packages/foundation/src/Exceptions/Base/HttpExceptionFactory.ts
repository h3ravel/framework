/**
 * Base HttpException
 */
export class HttpExceptionFactory extends Error {
    constructor(
        protected statusCode: number,
        public message: string = '',
        protected previous?: Error,
        protected headers: Record<string, string> = {},
        public code: number = 0,
    ) {
        super(message)
    }

    public getStatusCode (): number {
        return this.statusCode
    }

    public getHeaders (): Record<string, string> {
        return this.headers
    }

    public setHeaders (headers: Record<string, string>): void {
        this.headers = headers
    }
} 