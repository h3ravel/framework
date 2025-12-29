import { IApplication, IMiddleware } from '@h3ravel/contracts'
import { MiddlewareList, RedirectHandler } from '../Contracts/MiddlewareContract'

import { Arr } from '@h3ravel/support'

/**
 * Core Middleware configuration container.
 *
 * Use this class to programmatically build middleware lists and groups.
 * 
 * - Middleware entries can either be strings (identifiers) or instances of the middleware class in this core version.
 * - Callbacks/redirects accept string or () => string.
 * - Group replace/remove/append/prepend behavior retained.
 */
export class Middleware {
    /**
     * The user defined global middleware stack.
     */
    protected global: MiddlewareList = []
    /**
     * The middleware that should be prepended to the global middleware stack
     */
    protected prepends: MiddlewareList = []
    /**
     * The middleware that should be appended to the global middleware stack.
     */
    protected appends: MiddlewareList = []
    /**
     * The middleware that should be removed from the global middleware stack.
     */
    protected removals: MiddlewareList = []
    /**
     * The middleware that should be replaced in the global middleware stack.
     */
    protected replacements: Record<string, string> = {}

    protected groups: Record<string, MiddlewareList> = {}
    protected groupPrepends: Record<string, MiddlewareList> = {}
    protected groupAppends: Record<string, MiddlewareList> = {}
    protected groupRemovals: Record<string, MiddlewareList> = {}
    protected groupReplacements: Record<string, Record<string, IMiddleware>> = {}

    protected pageMiddleware: MiddlewareList[] = []
    protected _priority: MiddlewareList = []
    protected _trustHosts = false
    protected _statefulApi = false
    protected _throttleWithRedis = false
    protected apiLimiter: string | null = null
    protected authenticatedSessions = false
    protected customAliases: Record<string, IMiddleware> = {}
    protected prependPriority: Record<string, IMiddleware> = {}
    protected appendPriority: Record<string, IMiddleware> = {}

    constructor(private app?: IApplication) { }

    /**
     * Prepend middleware to the application's global middleware stack.
     * 
     * @param middleware 
     * @returns 
     */
    public prepend (middleware: MiddlewareList | IMiddleware): this {
        this.prepends = [...Arr.wrap(middleware), ...this.prepends]
        return this
    }

    /**
     * Append middleware to the application's global middleware stack.
     * 
     * @param middleware 
     * @returns 
     */
    public append (middleware: MiddlewareList | IMiddleware): this {
        this.appends = [...this.appends, ...Arr.wrap(middleware)]
        return this
    }

    /**
     * Remove middleware from the application's global middleware stack.
     * 
     * @param middleware 
     * @returns 
     */
    public remove (middleware: MiddlewareList | IMiddleware): this {
        this.removals = [...this.removals, ...Arr.wrap(middleware)]
        return this
    }

    /**
     * 
     * Specify a middleware that should be replaced with another middleware.
     * 
     * @param search 
     * @param replaceWith 
     * @returns 
     */
    public replace (search: string, replaceWith: string): this {
        this.replacements[search] = replaceWith
        return this
    }

    /**
     * Define the global middleware for the application.
     * 
     * @param middleware 
     * @returns 
     */
    public use (middleware: MiddlewareList): this {
        this.global = [...middleware]
        return this
    }

    /**
     * Define a middleware group.
     * 
     * @param groupName 
     * @param middleware 
     * @returns 
     */
    public group (groupName: string, middleware: MiddlewareList): this {
        this.groups[groupName] = [...middleware]
        return this
    }

    /**
     * Prepend the given middleware to the specified group.
     * 
     * @param group 
     * @param middleware 
     * @returns 
     */
    public prependToGroup (group: string, middleware: MiddlewareList | IMiddleware): this {
        this.groupPrepends[group] = [...Arr.wrap(middleware), ...(this.groupPrepends[group] ?? [])]
        return this
    }

    /**
     * Append the given middleware to the specified group.
     * 
     * @param group 
     * @param middleware 
     * @returns 
     */
    public appendToGroup (group: string, middleware: MiddlewareList | IMiddleware): this {
        this.groupAppends[group] = [...(this.groupAppends[group] ?? []), ...Arr.wrap(middleware)]
        return this
    }

    /**
     * Remove the given middleware from the specified group.
     * 
     * @param group 
     * @param middleware 
     * @returns 
     */
    public removeFromGroup (group: string, middleware: MiddlewareList | IMiddleware): this {
        this.groupRemovals[group] = [...Arr.wrap(middleware), ...(this.groupRemovals[group] ?? [])]
        return this
    }

    /**
     * Replace the given middleware in the specified group with another middleware
     * 
     * @param group 
     * @param search 
     * @param replaceWith 
     * @returns 
     */
    public replaceInGroup (group: string, search: string, replaceWith: IMiddleware): this {
        this.groupReplacements[group] = this.groupReplacements[group] ?? {}
        this.groupReplacements[group][search] = replaceWith
        return this
    }

    /**
     * Modify the middleware in the "web" group.
     * 
     * @param append 
     * @param prepend 
     * @param remove 
     * @param replace 
     * @returns 
     */
    public web (
        append: MiddlewareList | IMiddleware | [] = [],
        prepend: MiddlewareList | IMiddleware | [] = [],
        remove: MiddlewareList | IMiddleware | [] = [],
        replace: Record<string, IMiddleware> = {}
    ): this {
        return this.modifyGroup('web', append, prepend, remove, replace)
    }

    /**
     * Modify the middleware in the "api" group.
     * 
     * @param append 
     * @param prepend 
     * @param remove 
     * @param replace 
     * @returns 
     */
    public api (
        append: MiddlewareList | IMiddleware | [] = [],
        prepend: MiddlewareList | IMiddleware | [] = [],
        remove: MiddlewareList | IMiddleware | [] = [],
        replace: Record<string, IMiddleware> = {}
    ): this {
        return this.modifyGroup('api', append, prepend, remove, replace)
    }

    /**
     * Modify the middleware in the given group
     * 
     * @param group 
     * @param append 
     * @param prepend 
     * @param remove 
     * @param replace 
     * @returns 
     */
    protected modifyGroup (
        group: string,
        append: MiddlewareList | IMiddleware | [],
        prepend: MiddlewareList | IMiddleware | [],
        remove: MiddlewareList | IMiddleware | [],
        replace: Record<string, IMiddleware>
    ): this {
        if ((append as any) && (append as any).length !== 0) {
            this.appendToGroup(group, append as any)
        }
        if ((prepend as any) && (prepend as any).length !== 0) {
            this.prependToGroup(group, prepend as any)
        }
        if ((remove as any) && (remove as any).length !== 0) {
            this.removeFromGroup(group, remove as any)
        }
        if (replace && Object.keys(replace).length) {
            for (const [key, middleware] of Object.entries(replace)) {
                this.replaceInGroup(group, key, middleware)
            }
        }
        return this
    }
    /**
     * Register the page middleware for the application.
     * 
     * @param middleware 
     * @returns 
     */
    public pages (middleware: MiddlewareList[]): this {
        this.pageMiddleware = [...middleware]
        return this
    }

    /**
     * Register additional middleware aliases.
     * 
     * @param aliases 
     * @returns 
     */
    public alias (aliases: Record<string, IMiddleware> = {}): this {
        this.customAliases = { ...aliases }
        return this
    }

    /**
     * Define the middleware priority for the application.
     * 
     * @param list 
     * @returns 
     */
    public priority (list: MiddlewareList): this {
        this._priority = [...list]
        return this
    }

    /**
     * Prepend middleware to the priority middleware.
     * 
     * @param before 
     * @param prependKey 
     * @returns 
     */
    public prependToPriorityList (before: IMiddleware, prependKey: string): this {
        this.prependPriority[prependKey] = before
        return this
    }

    /**
     * Append middleware to the priority middleware
     * 
     * @param after 
     * @param appendKey 
     * @returns 
     */
    public appendToPriorityList (after: IMiddleware, appendKey: string): this {
        this.appendPriority[appendKey] = after
        return this
    }

    /**
     * Get the global middleware list after applying prepends/appends/replacements/removals.
     * 
     * @param defaults 
     * @returns 
     */
    public getGlobalMiddleware (defaults: MiddlewareList = []): MiddlewareList {
        const middleware = this.global.length ? [...this.global] : Arr.whereNotNull(defaults)

        const replaced = middleware.map((m) => typeof m === 'string' ? (this.replacements[m] ?? m) : m)

        const merged = Arr.unique([...this.prepends, ...replaced, ...this.appends])

        const result = merged.filter((m) => !this.removals.includes(m))

        return result
    }

    /**
     * Build middleware groups with applied group-level replacements, removals, prepends, appends.
     */
    public getMiddlewareGroups (): Record<string, MiddlewareList> {
        const built: Record<string, MiddlewareList> = {}

        const middleware: Record<string, MiddlewareList> = {
            'web': [
                'SubstituteBindings',
                this.authenticatedSessions ? 'auth.session' : null,
            ].filter(e => e !== null),

            'api': [
                this.apiLimiter ? 'throttle:' + this.apiLimiter : null,
            ].filter(e => e !== null),
        }

        // start with defaults if provided, else use current groups
        const base = { ...middleware, ...this.groups }

        for (const [group, list] of Object.entries(base)) {
            // clone base list for mutations
            let working = [...list]

            // apply group replacements
            const groupRepl = this.groupReplacements[group] ?? {}
            working = working.map((m) => typeof m === 'string' ? (groupRepl[m] ?? m) : m)

            // apply removals
            const removals = this.groupRemovals[group] ?? []
            if (removals.length) {
                working = working.filter((m) => !removals.includes(m))
            }

            // apply prepends / appends (unique)
            const prepends = this.groupPrepends[group] ?? []
            const appends = this.groupAppends[group] ?? []
            working = Arr.unique([...prepends, ...working, ...appends])

            built[group] = working
        }

        return built
    }

    /**
     * Configure where guests are redirected by the "auth" middleware
     * 
     * @param redirect 
     * @returns 
     */
    public redirectGuestsTo (redirect: RedirectHandler): this {
        return this.redirectTo(redirect, undefined)
    }

    /**
     * Configure where users are redirected by the "guest" middleware
     * 
     * @param redirect 
     * @returns 
     */
    public redirectUsersTo (redirect: RedirectHandler): this {
        return this.redirectTo(undefined, redirect)
    }

    /**
     * Register redirect handlers for the authentication and guest middleware.
     * 
     * @param guests 
     * @param users 
     * @returns 
     */
    public redirectTo (guests?: RedirectHandler, users?: RedirectHandler): this {

        guests = typeof guests === 'string' ? () => String(guests) : guests
        users = typeof users === 'string' ? () => String(users) : users

        if (guests) {
            // Authenticate.redirectUsing(guests)
            // AuthenticateSession.redirectUsing(guests)
            // AuthenticationException.redirectUsing(guests)
        }

        if (users) {
            // RedirectIfAuthenticated.redirectUsing(users)
        }
        return this
    }

    /**
     * Configure the cookie encryption middleware.
     * 
     * @param _ 
     * @returns 
     */
    public encryptCookies (_: MiddlewareList = []): this {
        // placeholder for cookie encryption; 
        return this
    }

    /**
     * Configure the CSRF token validation middleware.
     * 
     * @param _ 
     * @returns 
     */
    public validateCsrfTokens (_: MiddlewareList = []): this {
        // placeholder
        return this
    }

    /**
     * Configure the URL signature validation middleware
     * 
     * @param _ 
     * @returns 
     */
    public validateSignatures (_: MiddlewareList = []): this {
        // placeholder
        return this
    }

    /**
     * Configure the empty string conversion middleware.
     * 
     * @param _ 
     * @returns 
     */
    public convertEmptyStringsToNull (_: MiddlewareList = []): this {
        // placeholder
        return this
    }

    /**
     * Configure the string trimming middleware.
     * 
     * @param _ 
     * @returns 
     */
    public trimStrings (_: MiddlewareList = []): this {
        // placeholder
        return this
    }

    /**
     * Indicate that the trusted host middleware should be enabled
     * 
     * @param at 
     * @param subdomains 
     * @returns 
     */
    public trustHosts (at: any = null, subdomains = true): this {
        this._trustHosts = true
        return this
    }

    /**
     * Configure the trusted proxies for the application
     * 
     * @param _ 
     * @param __ 
     * @returns 
     */
    public trustProxies (_: any = null, __: number | null = null): this {
        return this
    }

    /**
     * Configure the middleware that prevents requests during maintenance mode
     * 
     * @param _ 
     * @returns 
     */
    public preventRequestsDuringMaintenance (_: MiddlewareList = []): this {
        return this
    }

    /**
     * Indicate that Sanctum's frontend state middleware should be enabled
     * 
     * @returns 
     */
    public statefulApi (): this {
        this._statefulApi = true
        return this
    }

    /**
     * Indicate that the API middleware group's throttling middleware should be enabled
     * 
     * @param limiter 
     * @param redis 
     * @returns 
     */
    public throttleApi (limiter: string = 'api', redis: boolean = false): this {
        this.apiLimiter = limiter
        if (redis) {
            this._throttleWithRedis = true
        }
        return this
    }

    /**
     * Indicate that H3ravel's throttling middleware should use Redis
     * 
     * @returns 
     */
    public throttleWithRedis (): this {
        this._throttleWithRedis = true
        return this
    }

    /**
     * Indicate that sessions should be authenticated for the "web" middleware group
     * 
     * @returns 
     */
    public authenticateSessions (): this {
        this.authenticatedSessions = true
        return this
    }

    /**
     * Get the page middleware for the application
     * 
     * @returns 
     */
    public getPageMiddleware (): MiddlewareList[] {
        return { ...this.pageMiddleware }
    }

    /**
     * Get the middleware aliases
     * 
     * @returns 
     */
    public getMiddlewareAliases (): Record<string, IMiddleware> {
        return { ...this.defaultAliases(), ...this.customAliases }
    }

    /**
     * Get the default middleware aliases
     * 
     * @returns 
     */
    public defaultAliases (): Record<string, IMiddleware> {
        const aliases: Record<string, string> = {
            auth: 'Authenticate',
            'auth.basic': 'AuthenticateWithBasicAuth',
            'auth.session': 'AuthenticateSession',
            'cache.headers': 'SetCacheHeaders',
            can: 'Authorize',
            guest: 'RedirectIfAuthenticated',
            signed: 'ValidateSignature',
            throttle: this._throttleWithRedis ? 'ThrottleRequestsWithRedis' : 'ThrottleRequests',
            verified: 'EnsureEmailIsVerified',
        }

        // @ts-expect-error TODO: ensure that actuall middlewares are aliased, not strings
        return aliases
    }

    /**
     * Get the middleware priority for the application
     * 
     * @returns 
     */
    public getMiddlewarePriority (): MiddlewareList {
        return [...this._priority]
    }

    /**
     * Get the middleware to prepend to the middleware priority definition
     * 
     * @returns 
     */
    public getMiddlewarePriorityPrepends (): Record<string, IMiddleware> {
        return { ...this.prependPriority }
    }

    /**
     * Get the middleware to append to the middleware priority definition
     * 
     * @returns 
     */
    public getMiddlewarePriorityAppends (): Record<string, IMiddleware> {
        return { ...this.appendPriority }
    }
}
