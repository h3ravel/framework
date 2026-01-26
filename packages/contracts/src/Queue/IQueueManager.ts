import { IQueueDriver } from './IQueueDriver'

/**
 * Queue manager contract for managing drivers and connections.
 */
export abstract class IQueueManager {
    abstract connection(name?: string): IQueueDriver

    abstract driver(name: string): IQueueDriver

    abstract extend(name: string, driver: IQueueDriver): void

    abstract getDefaultConnection(): string

    abstract setDefaultConnection(name: string): void
}
