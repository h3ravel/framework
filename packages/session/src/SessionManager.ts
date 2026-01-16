import { IApplication, IHttpContext, IRequest, ISessionDriver, ISessionManager, SessionDriverOption } from '@h3ravel/contracts'
import { createHash, createHmac, randomBytes } from 'crypto'
import { getCookie, setCookie } from 'h3'

import { FlashBag } from './FlashBag'
import { SessionStore } from './SessionStore'

/**
 * SessionManager
 *
 * Handles session initialization, ID generation, and encryption.
 * Each request gets a unique session namespace tied to its ID.
 */
export class SessionManager extends ISessionManager {
    private app: IApplication
    private ctx: IHttpContext
    private driver: ISessionDriver
    private appKey: string
    private sessionId: string
    private request: IRequest
    public flashBag: FlashBag

    /**
     * @param ctx - incoming request http context
     * @param driverName - registered driver key ('file' | 'database' | 'memory' | 'redis')
     * @param driverOptions - optional bag for driver-specific options
     */
    constructor(app?: IApplication, driverName?: 'file' | 'memory' | 'database' | 'redis', driverOptions?: SessionDriverOption)
    constructor(app?: IHttpContext | IApplication, driverName?: 'file' | 'memory' | 'database' | 'redis', driverOptions?: SessionDriverOption)
    constructor(app?: IHttpContext | IApplication, driverName: 'file' | 'memory' | 'database' | 'redis' = 'file', driverOptions: SessionDriverOption = {}) {
        super()
        this.appKey = process.env.APP_KEY!

        if (app instanceof IHttpContext) {
            this.request = app.request
            this.ctx = app
            this.app = app.app
        } else {
            this.app = app!
            this.ctx = app!.make('http.context')
            this.request = this.ctx.request
        }

        this.sessionId = this.resolveSessionId()

        // Then instantiate the driver through the registry so different constructors are supported
        this.driver = SessionStore.make(driverName, driverOptions.sessionId ?? this.sessionId, driverOptions)
        // @ts-expect-error caused by dist/src import missmatch
        this.flashBag = this.driver.flashBag
    }

    /**
     * Initialize the Session Manager
     * 
     * @param ctx 
     * @returns 
     */
    static init (app: IApplication) {
        return new SessionManager(
            app,
            config('session.driver', 'file'),
            {
                cwd: config('session.files'),
                sessionDir: '/',
                dir: '/',
                table: config('session.table'),
                prefix: config('database.connections.redis.options.prefix'),
                client: config(`database.connections.${config('session.driver', 'file')}.client`),
            }
        )
    }

    /**
     * Generate a secure session ID unique to the user device.
     */
    private generateSessionId (): string {
        const userAgent = this.request.getHeader('user-agent') || ''
        const ip = this.request.getHeader('x-forwarded-for') || this.request.ip() || ''
        const random = randomBytes(32).toString('hex')
        const fingerprint = createHash('sha256').update(`${userAgent}-${ip}`).digest('hex')

        return createHmac('sha256', this.appKey)
            .update(`${fingerprint}-${random}`)
            .digest('hex')
    }

    /**
     * Resolve the session ID from cookie, header, or create a new one.
     */
    private resolveSessionId (): string {
        const cookieSession = getCookie(this.ctx!.event, 'h3ravel_session')

        if (cookieSession) return cookieSession

        const newId = this.generateSessionId()

        setCookie(this.ctx!.event, 'h3ravel_session', newId, {
            httpOnly: true,
            secure: true,
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 7
        })
        return newId
    }

    /**
     * Access the current session ID.
     */
    id (): string {
        return this.sessionId
    }

    /**
     * Get the current session driver
     */
    getDriver (): ISessionDriver {
        return this.driver
    }

    /**
     * Retrieve a value from the session
     * 
     * @param key 
     * @param defaultValue
     * @returns 
     */
    get (key: string, defaultValue?: any): Promise<any> | any {
        return this.driver.get(key, defaultValue)
    }

    /** 
     * Store a value in the session
     * 
     * @param key 
     * @param value 
     */
    set (value: Record<string, any>): Promise<void> | void {
        return this.driver.set(value)
    }

    /** 
     * Store multiple key/value pairs
     * 
     * @param values 
     */
    put (key: string, value: any): void | Promise<void> {
        return this.driver.put(key, value)
    }

    /** 
     * Append a value to an array key
     * 
     * @param key 
     * @param value 
     */
    push (key: string, value: any): void | Promise<void> {
        return this.driver.push(key, value)
    }

    /** 
     * Remove a key from the session
     * 
     * @param key 
     */
    forget (key: string) {
        return this.driver.forget(key)
    }

    /** 
     * Retrieve all session data
     * 
     * @returns 
     */
    all () {
        return this.driver.all()
    }

    /** 
     * Determine if a key exists (even if null).
     * 
     * @param key 
     * @returns 
     */
    exists (key: string): Promise<boolean> | boolean {
        return this.driver.exists(key)
    }

    /** 
     * Determine if a key has a non-null value.
     * 
     * @param key 
     * @returns 
     */
    has (key: string): Promise<boolean> | boolean {
        return this.driver.has(key)
    }

    /**
     * Get only specific keys.
     * 
     * @param keys 
     * @returns 
     */
    only (keys: string[]) {
        return this.driver.only(keys)
    }

    /**
     * Return all keys except the specified ones.
     * 
     * @param keys 
     * @returns 
     */
    except (keys: string[]) {
        return this.driver.except(keys)
    }

    /**
     * Return and delete a key from the session.
     * 
     * @param key 
     * @param defaultValue 
     * @returns 
     */
    pull (key: string, defaultValue: any = null) {
        return this.driver.pull(key, defaultValue)
    }

    /**
     * Increment a numeric value by amount (default 1).
     * 
     * @param key 
     * @param amount 
     * @returns 
     */
    increment (key: string, amount = 1): Promise<number> | number {
        return this.driver.increment(key, amount)
    }

    /**
     * Decrement a numeric value by amount (default 1).
     * 
     * @param key 
     * @param amount 
     * @returns 
     */
    decrement (key: string, amount = 1) {
        return this.driver.decrement(key, amount)
    }

    /**
     * Flash a value for next request only.
     * 
     * @param key 
     * @param value 
     */
    flash (key: string, value: any) {
        return this.driver.flash(key, value)
    }

    /**
     * Reflash all flash data for one more cycle.
     * 
     * @returns 
     */
    reflash () {
        return this.driver.reflash()
    }

    /**
     * Keep only selected flash data.
     * 
     * @param keys 
     * @returns 
     */
    keep (keys: string[]) {
        return this.driver.keep(keys)
    }

    /**
     * Store data only for current request cycle (not persisted).
     * 
     * @param key 
     * @param value 
     */
    now (key: string, value: any) {
        return this.driver.now(key, value)
    }

    /**
     * Regenerate session ID and persist data under new ID.
     */
    regenerate () {
        return this.driver.regenerate()
    }

    /** 
     * Determine if an item is not present in the session. 
     * 
     * @param key 
     * @returns 
     */
    missing (key: string): Promise<boolean> | boolean {
        return this.driver.missing(key)
    }

    /** 
     * Flush all session data
     */
    flush () {
        return this.driver.flush()
    }

    /**
     * Invalidate the session completely and regenerate ID.
     * 
     * @returns 
     */
    invalidate () {
        return this.driver.invalidate()
    }

    /**
     * Age flash data at the end of the request lifecycle.
     * 
     * @returns 
     */
    ageFlashData () {
        return this.driver.ageFlashData()
    }
}
