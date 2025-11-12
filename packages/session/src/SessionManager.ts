import { DriverOption, SessionDriver } from './Contracts/SessionContract'
import { HttpContext, IRequest } from '@h3ravel/shared'
import { createHash, createHmac, randomBytes } from 'crypto'
import { getCookie, setCookie } from 'h3'

import { SessionStore } from './SessionStore'

/**
 * SessionManager
 *
 * Handles session initialization, ID generation, and encryption.
 * Each request gets a unique session namespace tied to its ID.
 */
export class SessionManager {
    private driver: SessionDriver
    private appKey: string
    private sessionId: string
    private request: IRequest

    /**
     * @param ctx - incoming request http context
     * @param driverName - registered driver key ('file' | 'database' | 'memory' | 'redis')
     * @param driverOptions - optional bag for driver-specific options
     */
    constructor(private ctx: HttpContext, driverName: 'file' | 'memory' | 'database' | 'redis' = 'file', driverOptions: DriverOption = {}) {
        this.appKey = process.env.APP_KEY!
        this.request = ctx.request

        this.sessionId = this.resolveSessionId()

        // Then instantiate the driver through the registry so different constructors are supported
        this.driver = SessionStore.make(driverName, driverOptions.sessionId ?? this.sessionId, driverOptions)
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
        const cookieSession = getCookie(this.ctx.event, 'h3ravel_session')

        if (cookieSession) return cookieSession

        const newId = this.generateSessionId()

        setCookie(this.ctx.event, 'h3ravel_session', newId, {
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
    public id (): string {
        return this.sessionId
    }

    /**
     * Proxy session methods directly to the driver.
     */
    public get (key: string): any | Promise<any> {
        return this.driver.get(key)
    }

    public set (key: string, value: any): void | Promise<void> {
        this.driver.set(key, value)
    }

    public put (data: Record<string, any>): void | Promise<void> {
        this.driver.put(data)
    }

    public push (key: string, value: any): void | Promise<void> {
        this.driver.push(key, value)
    }

    public forget (key: string): void | Promise<void> {
        this.driver.forget(key)
    }

    public all (): Record<string, any> | Promise<Record<string, any>> {
        return this.driver.all()
    }

    public flush (): void | Promise<void> {
        this.driver.flush()
    }
}
