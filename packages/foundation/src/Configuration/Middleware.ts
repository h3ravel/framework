import { MiddlewareIdentifier, MiddlewareList, RedirectHandler } from '../Contracts/MiddlewareContract'

import { Arr } from '@h3ravel/support'
import { MiddlewareHandler } from '../Http/MiddlewareHandler'

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
    protected groupReplacements: Record<string, Record<string, string>> = {}

    protected pageMiddleware: Record<string, MiddlewareList> = {}
    protected _priority: string[] = []
    protected _trustHosts = false
    protected _statefulApi = false
    protected _throttleWithRedis = false
    protected apiLimiter: string | null = null
    protected authenticatedSessions = false
    protected customAliases: Record<string, string> = {}
    protected prependPriority: Record<string, string> = {}
    protected appendPriority: Record<string, string> = {}

    constructor(public handler: MiddlewareHandler) { }

    /**
     * Prepend middleware to the application's global middleware stack.
     * 
     * @param middleware 
     * @returns 
     */
    public prepend (middleware: MiddlewareList | MiddlewareIdentifier): this {
        this.prepends = [...Arr.wrap(middleware), ...this.prepends]
        return this
    }

    /**
     * Append middleware to the application's global middleware stack.
     * 
     * @param middleware 
     * @returns 
     */
    public append (middleware: MiddlewareList | MiddlewareIdentifier): this {
        this.appends = [...this.appends, ...Arr.wrap(middleware)]
        return this
    }

    /**
     * Remove middleware from the application's global middleware stack.
     * 
     * @param middleware 
     * @returns 
     */
    public remove (middleware: MiddlewareList | MiddlewareIdentifier): this {
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
    public prependToGroup (group: string, middleware: MiddlewareList | MiddlewareIdentifier): this {
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
    public appendToGroup (group: string, middleware: MiddlewareList | MiddlewareIdentifier): this {
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
    public removeFromGroup (group: string, middleware: MiddlewareList | MiddlewareIdentifier): this {
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
    public replaceInGroup (group: string, search: string, replaceWith: string): this {
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
        append: MiddlewareList | MiddlewareIdentifier | [] = [],
        prepend: MiddlewareList | MiddlewareIdentifier | [] = [],
        remove: MiddlewareList | MiddlewareIdentifier | [] = [],
        replace: Record<string, string> = {}
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
        append: MiddlewareList | MiddlewareIdentifier | [] = [],
        prepend: MiddlewareList | MiddlewareIdentifier | [] = [],
        remove: MiddlewareList | MiddlewareIdentifier | [] = [],
        replace: Record<string, string> = {}
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
        append: MiddlewareList | MiddlewareIdentifier | [],
        prepend: MiddlewareList | MiddlewareIdentifier | [],
        remove: MiddlewareList | MiddlewareIdentifier | [],
        replace: Record<string, string>
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
            for (const [s, r] of Object.entries(replace)) {
                this.replaceInGroup(group, s, r)
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
    public pages (middleware: Record<string, MiddlewareList>): this {
        this.pageMiddleware = { ...middleware }
        return this
    }

    /**
     * Register additional middleware aliases.
     * 
     * @param aliases 
     * @returns 
     */
    public alias (aliases: Record<string, string>): this {
        this.customAliases = { ...aliases }
        return this
    }

    /**
     * Define the middleware priority for the application.
     * 
     * @param list 
     * @returns 
     */
    public priority (list: string[]): this {
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
    public prependToPriorityList (before: string, prependKey: string): this {
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
    public appendToPriorityList (after: string, appendKey: string): this {
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
     * 
     * @param defaultGroups 
     * @returns 
     */
    public getMiddlewareGroups (defaultGroups?: Record<string, MiddlewareList>): Record<string, MiddlewareList> {
        const built: Record<string, MiddlewareList> = {}

        // start with defaults if provided, else use current groups
        const base = { ...(defaultGroups ?? {}), ...this.groups }

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
     * Register redirect handlers; accepts string or () => string.
     * In this core version, we only store them and do not wire into any concrete Authenticate classes.
     */
    public redirectTo (guests?: RedirectHandler, users?: RedirectHandler): this {
        // store as normalized lambdas on customAliases for demo purposes
        if (guests) {
            const guestKey = '__redirect_guests'
            this.customAliases[guestKey] = typeof guests === 'string' ? guests : guests()
        }
        if (users) {
            const userKey = '__redirect_users'
            this.customAliases[userKey] = typeof users === 'string' ? users : users()
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
    public getPageMiddleware (): Record<string, MiddlewareList> {
        return { ...this.pageMiddleware }
    }

    /**
     * Get the middleware aliases
     * 
     * @returns 
     */
    public getMiddlewareAliases (): Record<string, string> {
        return { ...this.defaultAliases(), ...this.customAliases }
    }

    /**
     * Get the default middleware aliases
     * 
     * @returns 
     */
    public defaultAliases (): Record<string, string> {
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

        return aliases
    }

    /**
     * Get the middleware priority for the application
     * 
     * @returns 
     */
    public getMiddlewarePriority (): string[] {
        return [...this._priority]
    }

    /**
     * Get the middleware to prepend to the middleware priority definition
     * 
     * @returns 
     */
    public getMiddlewarePriorityPrepends (): Record<string, string> {
        return { ...this.prependPriority }
    }

    /**
     * Get the middleware to append to the middleware priority definition
     * 
     * @returns 
     */
    public getMiddlewarePriorityAppends (): Record<string, string> {
        return { ...this.appendPriority }
    }
}
