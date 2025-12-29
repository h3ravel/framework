import { dbBuilder, fileBuilder, memoryBuilder, redisBuilder } from '../adapters'

import { MakeSessionTableCommand } from '../Commands/MakeSessionTableCommand'
import { ServiceProvider } from '@h3ravel/foundation'
import { SessionStore } from '../SessionStore'

export class SessionServiceProvider extends ServiceProvider {
    public static priority = 895
    public static order = 'before:HttpServiceProvider'

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
}
