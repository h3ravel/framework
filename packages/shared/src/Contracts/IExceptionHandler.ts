import { HttpContext } from './IHttp'
import { IRequest } from './IRequest'
import { IResponse } from './IResponse'

export type ExceptionLimitSpec = {
    key?: string;
    maxAttempts: number;
    decaySeconds: number;
};
export type ExceptionLUnlimited = {
    unlimited: true;
};
/**
 * Rate Limiter Adapter Interface
 */
export interface RateLimiterAdapter {
    /**
     * Attempt a key with a maxAttempts and decaySeconds.
     *
     * Return true if this is allowed (i.e., *not* throttled),
     * false if the limit is reached.
     */
    attempt (key: string, maxAttempts: number, allowCallback: () => boolean | Promise<boolean>, decaySeconds: number): Promise<boolean>;
}

export type ExceptionConstructor<T = any> = new (...args: any[]) => T
export type ExceptionConditionCallback = (error: any) => boolean;
export type RenderExceptionCallback = (error: any, ctx: HttpContext) => IResponse | Promise<IResponse> | undefined | null;
export type ReportExceptionCallback = (error: any) => boolean | void | Promise<boolean | void>;
export type ThrottleExceptionCallback = (error: any) => ExceptionLimitSpec | ExceptionLUnlimited | null | undefined;

export declare abstract class IExceptionHandler {
    /**
     * The exception handler method
     *
     * @param error
     * @param ctx
     */
    handle?(error: Error, ctx: HttpContext): Promise<any>;
    /**
     * Register a reportable callback handler
     *
     * @param cb
     * @returns
     */
    reportable (cb: ReportExceptionCallback): this;
    renderable (cb: RenderExceptionCallback): this;
    dontReport (exceptions: ExceptionConstructor | ExceptionConstructor[]): this;
    stopIgnoring (exceptions: ExceptionConstructor | ExceptionConstructor[]): this;
    dontReportWhen (cb: ExceptionConditionCallback): this;
    dontReportDuplicates (): this;
    map (from: ExceptionConstructor, mapper: (error: any) => any): this;
    throttleUsing (cb: ThrottleExceptionCallback): this;
    buildContextUsing (cb: (e: any, current?: Record<string, any>) => Record<string, any>): this;
    setRateLimiter (adapter: RateLimiterAdapter): this;
    respondUsing (cb: (response: IResponse, error: any, request: IRequest) => IResponse | Promise<IResponse>): this;
    shouldRenderJsonWhen (cb: (request: IRequest, error: any) => boolean): this;
    /**
     * Entry point to reporting an exception.
     *
     * @param error
     * @returns
     */
    report (error: any): Promise<void>;
    /**
     * Render an exception into an HTTP Response.
     *
     * @param ctx
     * @param error
     * @returns
     */
    render (ctx: HttpContext, error: any): Promise<IResponse>;
    /**
     * getResponse
     */
    getResponse ({
        request
    }: HttpContext, payload: Record<string, any>, e: any): IResponse | Promise<IResponse>;
    /**
     * Not implemented in core. Subclass can implement and call RequestException helpers.
     *
     * @param _length
     */
    truncateRequestExceptionsAt (_length: number): this;
    /**
     * Set the log level
     *
     * @param _attributes
     */
    level (type: string, level: string): {
        level: string;
        type: string;
    };
    /**
     * Not implemented here; applicable to validation pipeline/UI.
     *
     * @param _attributes
     */
    dontFlash (_attributes: string | string[]): this;
}