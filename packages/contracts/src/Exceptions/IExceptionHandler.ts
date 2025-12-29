import { IHttpContext, IRequest, IResponse, LimitSpec, RateLimiterAdapter, Unlimited } from '..'

export type ExceptionConstructor<T = any> = new (...args: any[]) => T
export type ExceptionConditionCallback = (error: any) => boolean;
export type RenderExceptionCallback = (error: any, request: IRequest) => IResponse | Promise<IResponse> | undefined | null;
export type ReportExceptionCallback = (error: any) => boolean | void | Promise<boolean | void>;
export type ThrottleExceptionCallback = (error: any) => LimitSpec | Unlimited | null | undefined;

export abstract class IExceptionHandler {
    /**
     * The exception handler method
     *
     * @param error
     * @param ctx
     */
    abstract handle?(error: Error, ctx: IHttpContext): Promise<any>;
    /**
     * Register a reportable callback handler
     *
     * @param cb
     * @returns
     */
    abstract reportable (cb: ReportExceptionCallback): this;
    abstract renderable (cb: RenderExceptionCallback): this;
    abstract dontReport (exceptions: ExceptionConstructor | ExceptionConstructor[]): this;
    abstract stopIgnoring (exceptions: ExceptionConstructor | ExceptionConstructor[]): this;
    abstract dontReportWhen (cb: ExceptionConditionCallback): this;
    abstract dontReportDuplicates (): this;
    abstract map (from: ExceptionConstructor, mapper: (error: any) => any): this;
    abstract throttleUsing (cb: ThrottleExceptionCallback): this;
    abstract buildContextUsing (cb: (e: any, current?: Record<string, any>) => Record<string, any>): this;
    abstract setRateLimiter (adapter: RateLimiterAdapter): this;
    abstract respondUsing (cb: (response: IResponse, error: any, request: IRequest) => IResponse | Promise<IResponse>): this;
    abstract shouldRenderJsonWhen (cb: (request: IRequest, error: any) => boolean): this;
    /**
     * Entry point to reporting an exception.
     *
     * @param error
     * @returns
     */
    abstract report (error: any): Promise<void>;
    /**
     * Render an exception into an HTTP Response.
     *
     * @param ctx
     * @param error
     * @returns
     */
    abstract render (request: IRequest, error: any): Promise<IResponse>;
    /**
     * getResponse
     */
    abstract getResponse (request: IRequest, payload: Record<string, any>, e: any): IResponse | Promise<IResponse>;
    /**
     * Not implemented in core. Subclass can implement and call RequestException helpers.
     *
     * @param _length
     */
    abstract truncateRequestExceptionsAt (_length: number): this;
    /**
     * Set the log level
     *
     * @param _attributes
     */
    abstract level (type: string, level: string): {
        level: string;
        type: string;
    };
    /**
     * Not implemented here; applicable to validation pipeline/UI.
     *
     * @param _attributes
     */
    abstract dontFlash (_attributes: string | string[]): this;
}