import { DriverBuilder, DriverOption } from './Contracts/SessionContract'

import { DatabaseDriver } from './drivers/DatabaseDriver'
import { FileDriver } from './drivers/FileDriver'
import { MemoryDriver } from './drivers/MemoryDriver'
import { RedisDriver } from './drivers/RedisDriver'

/**
 * FileDriver builder
 * constructor(sessionId: string, sessionDir?: string, cwd?: string)
 */
export const fileBuilder: DriverBuilder = (sessionId, options: DriverOption = {}) => {
    const sessionDir = options.sessionDir ?? options.dir ?? './storage/sessions'
    const cwd = options.cwd ?? process.cwd()
    return new FileDriver(sessionId, sessionDir, cwd)
}

/**
 * DatabaseDriver builder
 * constructor(sessionId: string, table?: string)
 */
export const dbBuilder: DriverBuilder = (sessionId, options: DriverOption = {}) => {
    const table = options.table ?? 'sessions'
    return new DatabaseDriver(options.sessionId ?? sessionId, table)
}

/**
 * MemoryDriver builder
 * constructor(sessionId: string)
 */
export const memoryBuilder: DriverBuilder = (sessionId) => {
    return new MemoryDriver(sessionId)
}

/**
 * RedisDriver builder
 * constructor(sessionId: string, redisClient?: RedisClient, prefix?: string)
 */
export const redisBuilder: DriverBuilder = (sessionId, options: DriverOption = {}) => {
    const client = options.client // optional client instance
    const prefix = options.prefix ?? 'h3ravel:sessions:'
    return new RedisDriver(sessionId, client, prefix)
}
