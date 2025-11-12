import { dbBuilder, fileBuilder, memoryBuilder, redisBuilder } from '../adapters'

import { MakeSessionTableCommand } from '../Commands/MakeSessionTableCommand'
import { SessionStore } from '../SessionStore'

export class SessionServiceProvider {
    public registeredCommands?: (new (app: any, kernel: any) => any)[]
    public static priority = 895
    public static order = 'before:HttpServiceProvider'

    constructor(private app: any) { }

    register (): void {
        /**
         * Register default drivers.
         */
        SessionStore.register('file', fileBuilder)
        SessionStore.register('database', dbBuilder)
        SessionStore.register('memory', memoryBuilder)
        SessionStore.register('redis', redisBuilder)

        this.registeredCommands = [MakeSessionTableCommand]
    }

    boot (): void {
    }
}
