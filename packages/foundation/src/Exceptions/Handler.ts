/// <reference path="../../../http/src/app.globals.d.ts" />

import { FileSystem, HttpContext, IRequest, IResponse } from '@h3ravel/shared'
import { LimitSpec, RateLimiterAdapter, Unlimited } from '../Contracts/RateLimiterAdapter'

import { InMemoryRateLimiter } from '../Adapters/InMemoryRateLimiter'
import { readFileSync } from 'node:fs'

type Constructor<T = any> = new (...args: any[]) => T
type ReportCallback = (error: any) => boolean | void | Promise<boolean | void>
type RenderCallback = (error: any, ctx: HttpContext) => IResponse | Promise<IResponse> | undefined | null
type ConditionCallback = (error: any) => boolean
type ThrottleCallback = (error: any) => LimitSpec | Unlimited | null | undefined

/**
 *
 * Notes:
 *  - This file purposely keeps the API surface familiar to Laravel-ish handlers,
 *    but trimmed to essentials for H3ravel.
 *  - We will use `RateLimiterAdapter` to plug in Redis / cache-backed limiters later.
 */
export abstract class Handler {
    /**
     * List of exception constructors that should not be reported.
     */
    protected dontReportList: Constructor[] = []

    /**
     * Log Level
     */
    protected logLevel: { type?: string, level?: string } = {}

    /**
     * Internal exceptions that are not reported by default. Subclasses may expand.
     */
    protected internalDontReport: Constructor[] = []

    /**
     * Callbacks that inspect exceptions to determine if they should NOT be reported.
     */
    protected dontReportCallbacks: ConditionCallback[] = []

    /**
     * Reportable callbacks (can cancel reporting by returning false). 
     */
    protected reportCallbacks: ReportCallback[] = []

    /**
     * Render callbacks (can return a Response for a specific exception type).
     */
    protected renderCallbacks: RenderCallback[] = []

    /**
     * Exception mapping: from constructor -> mapper function (returns instance or new error).
     */
    protected exceptionMap = new Map<Constructor, (error: any) => any>()

    /**
     * Throttle callbacks: return limit spec or Unlimited or null
     */
    protected throttleCallbacks: ThrottleCallback[] = []

    /**
     * Context callbacks for building log context 
     */
    protected contextCallbacks: Array<(e: any, current?: Record<string, any>) => Record<string, any>> = []

    /**
     * Determines whether to hash throttle keys (default true)
     */
    protected hashThrottleKeys = true

    /**
     * Whether to avoid reporting duplicates
     */
    protected withoutDuplicates = false

    /**
     * Map of already reported exceptions (WeakMap to allow GC)
     */
    protected reportedExceptionMap = new WeakMap<object, boolean>()

    /**
     * Rate limiter adapter — can be replaced by container / DI.
     */
    protected rateLimiter: RateLimiterAdapter = new InMemoryRateLimiter()

    /**
     * no-op; subclasses can extend constructor and call super()
     */
    constructor() {
    }

    /**
     * The exception handler method
     * 
     * @param error 
     * @param ctx 
     */
    public handle?(error: Error, ctx: HttpContext): Promise<any>

    /**
     * Finalize response callback (respondUsing)
     * 
     * @param response 
     * @param error 
     * @param request 
     */
    protected finalizeResponseCallback?: (response: IResponse, error: any, request: IRequest) => IResponse | Promise<IResponse>

    /**
     * Callback to determine if JSON should be returned
     * 
     * @param request 
     * @param error 
     */
    protected shouldRenderJsonWhenCallback?: (request: IRequest, error: any) => boolean

    /**
     * Register a reportable callback handler
     * 
     * @param cb 
     * @returns 
     */
    public reportable (cb: ReportCallback) {
        this.reportCallbacks.push(cb)
        return this
    }

    public renderable (cb: RenderCallback) {
        this.renderCallbacks.push(cb)
        return this
    }

    public dontReport (exceptions: Constructor | Constructor[]) {
        const arr = Array.isArray(exceptions) ? exceptions : [exceptions]
        this.dontReportList = Array.from(new Set([...this.dontReportList, ...arr]))
        return this
    }

    public stopIgnoring (exceptions: Constructor | Constructor[]) {
        const arr = Array.isArray(exceptions) ? exceptions : [exceptions]
        this.dontReportList = this.dontReportList.filter((c) => !arr.includes(c))
        this.internalDontReport = this.internalDontReport.filter((c) => !arr.includes(c))
        return this
    }

    public dontReportWhen (cb: ConditionCallback) {
        this.dontReportCallbacks.push(cb)
        return this
    }

    public dontReportDuplicates () {
        this.withoutDuplicates = true
        return this
    }

    public map (from: Constructor, mapper: (error: any) => any) {
        this.exceptionMap.set(from, mapper)
        return this
    }

    public throttleUsing (cb: ThrottleCallback) {
        this.throttleCallbacks.push(cb)
        return this
    }

    public buildContextUsing (cb: (e: any, current?: Record<string, any>) => Record<string, any>) {
        this.contextCallbacks.push(cb)
        return this
    }

    public setRateLimiter (adapter: RateLimiterAdapter) {
        this.rateLimiter = adapter
        return this
    }

    public respondUsing (cb: (response: IResponse, error: any, request: IRequest) => IResponse | Promise<IResponse>) {
        this.finalizeResponseCallback = cb
        return this
    }

    public shouldRenderJsonWhen (cb: (request: IRequest, error: any) => boolean) {
        this.shouldRenderJsonWhenCallback = cb
        return this
    }

    /**
     * Entry point to reporting an exception.
     * 
     * @param error 
     * @returns 
     */
    public async report (error: any): Promise<void> {
        const e = this.mapException(error)

        if (this.shouldntReport(e)) {
            return
        }

        await this.reportThrowable(e)
    }

    /**
     * Internal reporting pipeline.
     * 
     * @param e 
     * @returns 
     */
    protected async reportThrowable (e: any): Promise<void> {
        if (this.withoutDuplicates && this.reportedExceptionMap.get(e) === true) {
            return
        }

        this.reportedExceptionMap.set(e, true)

        /* If the exception itself defines a `report` method, let it run (if callable). */
        try {
            if (typeof (e?.report) === 'function') {
                const result = await Promise.resolve(e.report())
                if (result === false) {
                    return
                }
            }
        } catch {
            /* If reporting from exception fails, continue to handler callbacks. */
        }

        /* Run registered report callbacks — any callback returning false stops reporting. */
        for (const cb of this.reportCallbacks) {
            try {
                const result = await Promise.resolve(cb(e))
                if (result === false) {
                    return
                }
            } catch {
                // swallow callback errors but continue
            }
        }

        /* Throttle check: if throttled, skip logging */
        const throttled = await this.isThrottled(e)
        if (throttled) return

        /* Actual logging — subclasses should override newLogger or this method to plug real loggers. */
        try {
            const logger = this.newLogger()
            const level = this.mapLogLevel(e)

            const context = this.buildExceptionContext(e)

            if (typeof (logger as any)[level] === 'function') {
                ; (logger as any)[level](e?.message ?? String(e), context)
            } else if (typeof logger.log === 'function') {
                logger.log(level, e?.message ?? String(e), context)
            } else {
                /* Fallback */

                console.error(`[${level}]`, e, context)
            }
        } catch {
            /* If logger fails, rethrow original exception to avoid silent failure in critical systems. */
            throw e
        }
    }

    /**
     * Decide whether an exception should not be reported.
     * 
     * @param e 
     * @returns 
     */
    protected shouldntReport (e: any): boolean {
        if (this.withoutDuplicates && this.reportedExceptionMap.get(e) === true) {
            return true
        }

        if (this.isInstanceOfAny(e, this.internalDontReport)) {
            return true
        }

        if (this.isInstanceOfAny(e, this.dontReportList)) {
            return true
        }

        for (const cb of this.dontReportCallbacks) {
            try {
                if (cb(e) === true) return true
            } catch {
                // swallow user callback errors
            }
        }

        return false
    }

    /**
     * Throttle evaluation. Returns true when reporting should be skipped.
     * 
     * @param e 
     * @returns 
     */
    protected async isThrottled (e: any): Promise<boolean> {
        for (const cb of this.throttleCallbacks) {
            try {
                const spec = await Promise.resolve(cb(e))
                if (!spec) continue

                if ('unlimited' in (spec as any)) {
                    return false
                }

                const s = spec as LimitSpec
                const key = s.key ?? `h3ravel:exceptions:${e.constructor?.name ?? 'unknown'}`
                const hashedKey = this.hashThrottleKeys ? this.hashKey(key) : key

                /* rateLimiter.attempt returns true if allowed */
                try {
                    const allowed = await this.rateLimiter.attempt(hashedKey, s.maxAttempts, () => true, s.decaySeconds)
                    return !allowed
                } catch {
                    // if limiter crashes, don't throttle (fail-open)
                    return false
                }
            } catch {
                // ignore callback errors
            }
        }

        return false
    }

    /**
     * Apply mappings and unwrap inner exceptions if present.
     * 
     * @param error 
     * @returns 
     */
    protected mapException (error: any): any {
        /* unwrap common inner pattern */
        if (error && typeof error.getInnerException === 'function') {
            try {
                const inner = error.getInnerException()
                if (inner) return this.mapException(inner)
            } catch {
                // ignore inner extraction errors
            }
        }

        /* run registered mappers */
        for (const [from, mapper] of this.exceptionMap.entries()) {
            if (error instanceof from) {
                try {
                    return mapper(error)
                } catch {
                    // mapper failed, continue
                }
            }
        }

        return error
    }

    /**
     * Render an exception into an HTTP Response.
     * 
     * @param ctx 
     * @param error 
     * @returns 
     */
    public async render (ctx: HttpContext, error: any): Promise<IResponse> {
        const e = this.mapException(error)

        const { Response } = await import('@h3ravel/http')

        /**
         * If the exception instance has its own render(request) method prefer it.
         */
        if (e && typeof e.render === 'function') {
            try {
                const resp = await Promise.resolve(e.render(ctx, e))
                if (resp instanceof Response) return this.finalizeRenderedResponse(ctx.request, resp, e)
            } catch {
                // ignore and continue to handler-level renderers
            }
        }

        /**
         * If error implements Responsable-like `toResponse(request)`
         */
        if (e && typeof e.toResponse === 'function') {
            try {
                const resp = await Promise.resolve(e.toResponse(ctx.request))
                if (resp instanceof Response) return this.finalizeRenderedResponse(ctx.request, resp, e)
                else if (Object.entries(resp).length) return this.getResponse(ctx, resp, e)
            } catch {
                // ignore and continue
            }
        }

        /**
         * Try render callbacks
         */
        for (const cb of this.renderCallbacks) {
            try {
                const resp = await Promise.resolve(cb(e, ctx))
                if (resp instanceof Response) {
                    return this.finalizeRenderedResponse(ctx.request, resp, e)
                }
            } catch {
                // swallow render callback errors
            }
        }

        /**
         * Return JSON response when shouldRenderJson / expectsJson, else generic HTML/text
         */
        if (this.shouldReturnJson(ctx.request, e)) {
            return this.finalizeRenderedResponse(ctx.request, this.prepareJsonResponse(ctx.request, e), e)
        }

        return this.finalizeRenderedResponse(ctx.request, await this.prepareResponse(ctx.request, e), e)
    }

    /**
     * getResponse
     */
    public getResponse ({ request }: HttpContext, payload: Record<string, any>, e: any): IResponse | Promise<IResponse> {
        if (this.shouldReturnJson(request, e)) {
            return response()
                .setStatusCode(this.isHttpException(e) ? (e.status as number) : 500)
                .json(payload)
        }

        const view = FileSystem.resolveModulePath('@h3ravel/foundation', [
            'dist/views/errors/error.edge',
            'views/errors/error.edge'
        ]) ?? ''

        const body = payload.message ?? (this.isHttpException(e) ? (e.message ?? 'Error') : 'Internal Server Error')

        return response()
            .setStatusCode(this.isHttpException(e) ? (e.status as number) : 500)
            .viewTemplate(readFileSync(view, { encoding: 'utf-8' }), {
                statusCode: this.isHttpException(e) ? (e.status as number) : 500,
                message: body,
                exception: e,
                debug: this.appDebug()
            })
    }

    /**
     * Default non-JSON response (simple string). Subclass to integrate templating.
     * 
     * @param _request 
     * @param e 
     * @returns 
     */
    protected prepareResponse (_request: IRequest, e: any): IResponse | Promise<IResponse> {
        const body = this.isHttpException(e) ? (e.message ?? 'Error') : 'Internal Server Error'

        const view = FileSystem.resolveModulePath('@h3ravel/foundation', [
            'dist/views/errors/error.edge',
            'views/errors/error.edge'
        ]) ?? ''

        return response()
            .setStatusCode(this.isHttpException(e) ? (e.status as number) : 500)
            .viewTemplate(readFileSync(view, { encoding: 'utf-8' }), {
                statusCode: this.isHttpException(e) ? (e.status as number) : 500,
                message: body,
                exception: e,
                debug: this.appDebug()
            })
    }

    /**
     * Finalizes a rendered response using the finalize callback if present.
     * 
     * @param request 
     * @param response 
     * @param e 
     * @returns 
     */
    protected async finalizeRenderedResponse (request: IRequest, response: IResponse, e: any): Promise<IResponse> {
        if (this.finalizeResponseCallback) {
            try {
                const out = await Promise.resolve(this.finalizeResponseCallback(response, e, request))
                return out ?? response
            } catch {
                return response
            }
        }

        return response
    }

    /**
     * Decide whether to return JSON.
     * 
     * @param request 
     * @param e 
     * @returns 
     */
    protected shouldReturnJson (request: IRequest, e: any): boolean {
        if (this.shouldRenderJsonWhenCallback) {
            try {
                return this.shouldRenderJsonWhenCallback(request, e)
            } catch {
                // fallback
            }
        }

        /**
         * assume Request exposes expectsJson()
         **/
        try {
            return typeof request.expectsJson === 'function' ? request.expectsJson() : false
        } catch {
            return false
        }
    }

    /**
     * Prepare a Json Response for the exception.
     *
     * Subclasses can override convertExceptionToArray for different debug behavior.
     * 
     * @param _request 
     * @param e 
     * @returns 
     */
    protected prepareJsonResponse (_request: IRequest, e: any): IResponse {
        const payload = this.convertExceptionToArray(e)
        return response()
            .setStatusCode(this.isHttpException(e) ? (e.status as number) : 500)
            .json(payload)
    }

    /**
     * Convert exception into debug-friendly array/object.
     * 
     * @param e 
     * @returns 
     */
    protected convertExceptionToArray (e: any): Record<string, any> {
        const debug = this.appDebug()
        if (!debug) {
            return {
                message: this.isHttpException(e) ? e.message : 'Internal Server Error',
            }
        }

        const trace = Array.isArray(e?.stack?.split?.('\n')) ? e.stack.split('\n') : []

        return {
            message: e?.message ?? String(e),
            exception: e?.constructor?.name ?? typeof e,
            trace,
        }
    }

    /**
     * Build final exception context for logging.
     * 
     * @param e 
     * @returns 
     */
    protected buildExceptionContext (e: any): Record<string, any> {
        const defaultContext = this.exceptionContext(e)
        const extra = this.context()
        return { ...defaultContext, ...extra, exception: e }
    }

    /**
     * Allow exceptions to supply their own context via `context()` method.
     * 
     * @param e 
     * @returns 
     */
    protected exceptionContext (e: any): Record<string, any> {
        let ctx: Record<string, any> = {}

        if (e && typeof e.context === 'function') {
            try {
                ctx = e.context() ?? {}
            } catch {
                ctx = {}
            }
        }

        for (const cb of this.contextCallbacks) {
            try {
                ctx = { ...ctx, ...cb(e, ctx) }
            } catch {
                // ignore callback errors
            }
        }

        return ctx
    }

    /**
     * Default contextual info for logs (e.g., user id).
     *
     * Subclasses may override. Try/catch to avoid breaking logging flow.
     */
    protected context (): Record<string, any> {
        try {
            /* Example: if you have an Auth module, fetch user id here */
            return {}
        } catch {
            return {}
        }
    }

    /**
     * Check if a method is an instance of any of the listed classes
     * 
     * @param e 
     * @param list 
     * @returns 
     */
    protected isInstanceOfAny (e: any, list: Constructor[]) {
        if (!e) return false
        for (const c of list) {
            try {
                if (e instanceof c) return true
            } catch {
                // ignore invalid constructors
            }
        }
        return false
    }

    /**
     * Check if an exxeption is an HTTP execption
     * 
     * @param e 
     * @returns 
     */
    protected isHttpException (e: any): e is { status: number; headers?: Record<string, any>, message?: string } {
        return e && typeof e.status === 'number'
    }

    /**
     * Default mapping — subclasses can override for custom logic
     * 
     * @param _e 
     */
    protected mapLogLevel (_e: any): string {
        return 'error'
    }

    /**
     * Subclasses should return PSR-like logger (object with methods like error, warn, info or a `log` fn)
     */
    protected newLogger (): any {
        return console
    }

    /**
     * Hook to read from config/environment. Subclass or container should supply real value.
     */
    protected appDebug (): boolean {
        return typeof process !== 'undefined' &&
            process.env &&
            process.env.NODE_ENV !== 'production' &&
            process.env.APP_ENV !== 'production'
    }

    /**
     * Lightweight hash to avoid leaking raw keys in shared stores.
     * In the future, will be replaced with a real hash (xxh128 / sha256) if needed.
     * 
     * @param key 
     */
    protected hashKey (key: string) {
        let h = 2166136261 >>> 0
        for (let i = 0; i < key.length; i++) {
            h ^= key.charCodeAt(i)
            h = Math.imul(h, 16777619) >>> 0
        }
        return `h3:${h.toString(16)}`
    }

    /**
     * Not implemented in core. Subclass can implement and call RequestException helpers.
     * 
     * @param _length 
     */
    public truncateRequestExceptionsAt (_length: number) {
        return this
    }

    /**
     * Set the log level
     * 
     * @param _attributes 
     */
    public level (type: string, level: string) {
        return this.logLevel = { level, type }
    }

    /**
     * Not implemented here; applicable to validation pipeline/UI.
     * 
     * @param _attributes 
     */
    public dontFlash (_attributes: string | string[]) {
        return this
    }
}