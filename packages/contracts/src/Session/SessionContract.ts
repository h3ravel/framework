import { ISessionDriver } from './ISessionDriver'

export interface SessionDriverOption {
    cwd?: string
    dir?: string
    table?: string
    prefix?: string
    client?: any
    sessionId?: string
    sessionDir?: string
}

/**
 * A builder function that returns a SessionDriver for a given sessionId.
 *
 * The builder receives the sessionId and a driver-specific options bag.
 */
export type SessionDriverBuilder = (sessionId: string, options?: SessionDriverOption) => ISessionDriver