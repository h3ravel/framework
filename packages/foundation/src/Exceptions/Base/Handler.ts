import type { ExceptionConditionCallback, ExceptionConstructor, IHttpContext, IRequest, IResponse, RateLimiterAdapter, LimitSpec } from '@h3ravel/contracts'
import { IExceptionHandler, type RenderExceptionCallback, type ReportExceptionCallback, type ThrottleExceptionCallback } from '@h3ravel/contracts'

import { FileSystem, Console, Logger } from '@h3ravel/shared'
import { InMemoryRateLimiter } from '../../Adapters/InMemoryRateLimiter'
import { readFileSync } from 'node:fs'
import { HttpExceptionFactory } from './HttpExceptionFactory'
import { statusTexts } from '../../Http/ResponseUtilities'
import { Str } from '@h3ravel/support'
import { CommandNotFoundException } from '../CommandNotFoundException'

/**
 *
 * Base Exception Handler
 * .
 *  - We will use `RateLimiterAdapter` to plug in Redis / cache-backed limiters later.
 */
export abstract class Handler extends IExceptionHandler {
    /**
     * List of exception constructors that should not be reported.
     */
    protected dontReportList: ExceptionConstructor[] = []

    /**
     * A map of exceptions with their corresponding custom log levels.
     */
    protected levels = new Map<Error | string, Exclude<keyof typeof Console, 'prototype'>>()

    /**
     * Internal exceptions that are not reported by default. Subclasses may expand.
     */
    protected internalDontReport: ExceptionConstructor[] = []

    /**
     * Callbacks that inspect exceptions to determine if they should NOT be reported.
     */
    protected dontReportCallbacks: ExceptionConditionCallback[] = []

    /**
     * Reportable callbacks (can cancel reporting by returning false). 
     */
    protected reportCallbacks: ReportExceptionCallback[] = []

    /**
     * Render callbacks (can return a Response for a specific exception type).
     */
    protected renderCallbacks: RenderExceptionCallback[] = []

    /**
     * Exception mapping: from constructor.mapper function (returns instance or new error).
     */
    protected exceptionMap = new Map<ExceptionConstructor, (error: any) => any>()

    /**
     * Throttle callbacks: return limit spec or Unlimited or null
     */
    protected throttleCallbacks: ThrottleExceptionCallback[] = []

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
     * The exception handler method
     * 
     * @param error 
     * @param ctx 
     */
    handle?(error: Error, ctx: IHttpContext): Promise<any>

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
    reportable (cb: ReportExceptionCallback) {
        this.reportCallbacks.push(cb)
        return this
    }

    renderable (cb: RenderExceptionCallback) {
        this.renderCallbacks.push(cb)
        return this
    }

    dontReport (exceptions: ExceptionConstructor | ExceptionConstructor[]) {
        const arr = Array.isArray(exceptions) ? exceptions : [exceptions]
        this.dontReportList = Array.from(new Set([...this.dontReportList, ...arr]))
        return this
    }

    stopIgnoring (exceptions: ExceptionConstructor | ExceptionConstructor[]) {
        const arr = Array.isArray(exceptions) ? exceptions : [exceptions]
        this.dontReportList = this.dontReportList.filter((c) => !arr.includes(c))
        this.internalDontReport = this.internalDontReport.filter((c) => !arr.includes(c))
        return this
    }

    dontReportWhen (cb: ExceptionConditionCallback) {
        this.dontReportCallbacks.push(cb)
        return this
    }

    dontReportDuplicates () {
        this.withoutDuplicates = true
        return this
    }

    map (from: ExceptionConstructor, mapper: (error: any) => any) {
        this.exceptionMap.set(from, mapper)
        return this
    }

    throttleUsing (cb: ThrottleExceptionCallback) {
        this.throttleCallbacks.push(cb)
        return this
    }

    buildContextUsing (cb: (e: any, current?: Record<string, any>) => Record<string, any>) {
        this.contextCallbacks.push(cb)
        return this
    }

    setRateLimiter (adapter: RateLimiterAdapter) {
        this.rateLimiter = adapter
        return this
    }

    respondUsing (cb: (response: IResponse, error: any, request: IRequest) => IResponse | Promise<IResponse>) {
        this.finalizeResponseCallback = cb
        return this
    }

    shouldRenderJsonWhen (cb: (request: IRequest, error: any) => boolean) {
        this.shouldRenderJsonWhenCallback = cb
        return this
    }

    /**
     * Entry point to reporting an exception.
     * 
     * @param error 
     * @returns 
     */
    async report (error: Error): Promise<void> {
        const e = this.mapException(error)

        if (this.shouldntReport(e)) {
            return
        }

        await this.reportThrowable(e)
    }

    /**
     * Render an exception to the console.
     *
     * @param e
     */
    renderForConsole (e: Error) {
        if (e instanceof CommandNotFoundException) {
            let message = Str.of(e.message).explode('.').at(0) ?? ''
            const alternatives = e.getAlternatives()
            if (alternatives != null) {
                message += '. Do you mean one of these?'

                Logger.log(message, 'white')
                Logger.parse(alternatives.map(e => ['• ' + e, 'gray']), '\n')

                Logger.log('', 'white')
            } else {
                Logger.log(message, 'white')
            }

            return
        }

        const error = this.convertExceptionToArray(e)
        Logger.log(`Exception: ${error.exception ?? 'UnknownException'}`, 'white')
        Logger.error(error.message ?? 'Unknown Error')
        if (error.trace)
            Logger.parse(error.trace.map(e => ['• ' + e, 'gray']), '\n')
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

            if (typeof logger[level] === 'function') {
                logger[level](context)
            } else if (typeof logger.log === 'function') {
                logger.log(level, context)
            } else {
                Console.error(`[${level}]`, context)
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
    async render (request: IRequest, error: any): Promise<IResponse> {
        const e = this.mapException(error)

        const { Response } = await import('@h3ravel/http')

        /**
         * If the exception instance has its own render(request) method prefer it.
         */
        if (e && typeof e.render === 'function') {
            try {
                const resp = await Promise.resolve(e.render(request, e))
                if (resp instanceof Response) return this.finalizeRenderedResponse(request, resp as never, e)
            } catch {
                // ignore and continue to handler-level renderers
            }
        }

        /**
         * If error implements ResponsableType-like `toResponse(request)`
         */
        if (e && typeof e.toResponse === 'function') {
            try {
                const resp = await Promise.resolve(e.toResponse(request))

                if (resp instanceof Response) return this.finalizeRenderedResponse(request, resp as never, e)
                else if (Object.entries(resp).length) return this.getResponse(request, resp, e)
            } catch {
                // ignore and continue
            }
        }

        /**
         * Try render callbacks
         */
        for (const cb of this.renderCallbacks) {
            try {
                const resp = await Promise.resolve(cb(e, request))
                if (resp instanceof Response) {
                    return this.finalizeRenderedResponse(request, resp, e)
                }
            } catch {
                // swallow render callback errors
            }
        }

        /**
         * Return JSON response when shouldRenderJson / expectsJson, else generic HTML/text
         */
        if (this.shouldReturnJson(request, e)) {
            return this.finalizeRenderedResponse(request, this.prepareJsonResponse(request, e), e)
        }

        return await this.finalizeRenderedResponse(request, await this.prepareResponse(request, e), e)
    }

    /**
     * getResponse
     */
    getResponse (request: IRequest, payload: Record<string, any>, e: any): IResponse | Promise<IResponse> {
        if (this.shouldReturnJson(request, e)) {
            return response()
                .setCharset('utf-8')
                .setStatusCode(this.isHttpException(e) ? e.getStatusCode() : 500)
                .json(payload)
        }

        const view = FileSystem.resolveModulePath('@h3ravel/foundation', [
            'dist/views/errors/error.edge',
            'views/errors/error.edge'
        ]) ?? ''

        const body = payload.message ?? (this.isHttpException(e) ? (e.message ?? 'Error') : 'Internal Server Error')

        return response()
            .setCharset('utf-8')
            .setStatusCode(this.isHttpException(e) ? e.getStatusCode() : 500)
            .viewTemplate(readFileSync(view, { encoding: 'utf-8' }), {
                statusCode: this.isHttpException(e) ? e.getStatusCode() : 500,
                statusText: statusTexts[this.isHttpException(e) ? e.getStatusCode() : 500],
                message: body,
                exception: e,
                debug: this.appDebug()
            })
    }

    /**
     * Default non-JSON response (simple string). Subclass to integrate templating.
     * 
     * @param request 
     * @param e 
     * @returns 
     */
    protected prepareResponse (request: IRequest, e: any): IResponse | Promise<IResponse> {
        void request

        const body = this.isHttpException(e) ? (e.message ?? 'Error') : 'Internal Server Error'

        const view = FileSystem.resolveModulePath('@h3ravel/foundation', [
            'dist/views/errors/error.edge',
            'views/errors/error.edge'
        ]) ?? ''

        return response()
            .setCharset('utf-8')
            .setStatusCode(this.isHttpException(e) ? e.getStatusCode() : 500)
            .viewTemplate(readFileSync(view, { encoding: 'utf-8' }), {
                statusCode: this.isHttpException(e) ? e.getStatusCode() : 500,
                statusText: statusTexts[this.isHttpException(e) ? e.getStatusCode() : 500],
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
            .setCharset('utf-8')
            .setStatusCode(this.isHttpException(e) ? e.getStatusCode() : 500)
            .json(payload)
    }

    /**
     * Convert exception into debug-friendly array/object.
     * 
     * @param e 
     * @returns 
     */
    protected convertExceptionToArray (e: any): { message?: string; exception?: string; trace?: string[] } {
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
            /**
             * TODO: To be implemented
             * Example: if we have an Auth module, we canfetch user id here 
             */
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
    protected isInstanceOfAny (e: any, list: ExceptionConstructor[]) {
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
    protected isHttpException (e: any): e is HttpExceptionFactory {
        return e instanceof HttpExceptionFactory
    }

    /**
     * Default mapping — subclasses can override for custom logic
     * 
     * @param _e 
     */
    protected mapLogLevel (e: string | Error): Exclude<keyof typeof Console, 'prototype'> {
        return this.levels.get(e) ?? 'error'
    }

    /**
     * Subclasses should return PSR-like logger (object with methods like error, warn, info or a `log` fn)
     */
    protected newLogger () {
        return Console
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
    truncateRequestExceptionsAt (_length: number) {
        return this
    }

    /**
     * Set the log level
     * 
     * @param _attributes 
     */
    level (type: string | Error, level: Exclude<keyof typeof Console, 'prototype'>) {
        this.levels.set(type, level)
        return this
    }

    /**
     * Not implemented here; applicable to validation pipeline/UI.
     * 
     * @param _attributes 
     */
    dontFlash (_attributes: string | string[]) {
        return this
    }
}