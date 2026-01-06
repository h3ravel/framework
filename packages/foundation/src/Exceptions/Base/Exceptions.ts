import { Arr } from '@h3ravel/support'
import { IExceptionHandler } from '@h3ravel/contracts'
import { RequestException } from './RequestException'

export class Exceptions {
    /**
     * Create a new exception handling configuration instance.
     */
    constructor(public handler: IExceptionHandler) { }

    /**
     * Register a reportable callback.
     */
    public report (using: (...args: any[]) => any) {
        return this.handler.reportable(using)
    }

    /**
     * Register a reportable callback.
     */
    public reportable (reportUsing: (...args: any[]) => any) {
        return this.handler.reportable(reportUsing)
    }

    /**
     * Register a renderable callback.
     */
    public render (using: (...args: any[]) => any) {
        this.handler.renderable(using)
        return this
    }

    /**
     * Register a renderable callback.
     */
    public renderable (renderUsing: (...args: any[]) => any) {
        this.handler.renderable(renderUsing)
        return this
    }

    /**
     * Register a callback to prepare the final rendered exception response.
     */
    public respond (using: (...args: any[]) => any) {
        this.handler.respondUsing(using)
        return this
    }

    /**
     * Specify the callback that should be used to throttle reportable exceptions.
     */
    public throttle (throttleUsing: (...args: any[]) => any) {
        this.handler.throttleUsing(throttleUsing)
        return this
    }

    /**
     * Register a new exception mapping.
     */
    public map (from: typeof RequestException | ((e: any) => any), to?: typeof RequestException | ((e: any) => any)) {
        this.handler.map(from as never, to as never)
        return this
    }

    /**
     * Set the log level for the given exception type.
     */
    public level (type: string | Error, level: 'log' | 'debug' | 'warn' | 'info' | 'error') {
        this.handler.level(type, level)
        return this
    }

    /**
     * Register a closure that should be used to build exception context data.
     */
    public context (contextCallback: (...args: any[]) => Record<string, any>) {
        this.handler.buildContextUsing(contextCallback)
        return this
    }

    /**
     * Indicate that the given exception type should not be reported.
     */
    public dontReport (classOrArray: typeof RequestException | typeof RequestException[]) {
        for (const exceptionClass of Arr.wrap(classOrArray)) {
            this.handler.dontReport(exceptionClass)
        }
        return this
    }

    /**
     * Register a callback to determine if an exception should not be reported.
     */
    public dontReportWhen (dontReportWhen: (error: Error) => boolean) {
        this.handler.dontReportWhen(dontReportWhen)
        return this
    }

    /**
     * Do not report duplicate exceptions.
     */
    public dontReportDuplicates () {
        this.handler.dontReportDuplicates()
        return this
    }

    /**
     * Indicate that the given attributes should never be flashed to the session on validation errors.
     */
    public dontFlash (attributes: string | string[]) {
        this.handler.dontFlash(attributes)
        return this
    }

    /**
     * Register the callable that determines if the exception handler response should be JSON.
     */
    public shouldRenderJsonWhen (
        callback: (request: any, error: Error) => boolean
    ) {
        this.handler.shouldRenderJsonWhen(callback)
        return this
    }

    /**
     * Render an exception to the console.
     *
     * @param e
     */
    public renderForConsole (e: Error) {
        this.handler.renderForConsole(e)
    }

    /**
     * Indicate that the given exception class should not be ignored.
     */
    public stopIgnoring (classOrArray: typeof RequestException | typeof RequestException[]) {
        this.handler.stopIgnoring(classOrArray)
        return this
    }

    /**
     * Set the truncation length for request exception messages.
     */
    public truncateRequestExceptionsAt (length: number) {
        RequestException.truncateAt(length)
        return this
    }

    /**
     * Disable truncation of request exception messages.
     */
    public dontTruncateRequestExceptions () {
        RequestException.dontTruncate()
        return this
    }
}