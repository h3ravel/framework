import { IQueueManager, IQueueDriver } from '@h3ravel/contracts'

/**
 * Queue manager for managing drivers and connections.
 */
export class QueueManager extends IQueueManager {
    /**
     * Map of driver names to driver instances.
     */
    protected drivers: Map<string, IQueueDriver> = new Map()

    /**
     * Map of connection names to driver names.
     */
    protected connections: Map<string, string> = new Map()

    /**
     * The default connection name.
     */
    protected defaultConnection: string = 'default'

    /**
     * Get a queue driver for the given connection.
     */
    connection(name?: string): IQueueDriver {
        const connectionName = name || this.defaultConnection
        const driverName = this.connections.get(connectionName) || connectionName

        const driver = this.drivers.get(driverName)
        if (!driver) {
            throw new Error(`Queue driver "${driverName}" is not registered`)
        }

        return driver
    }

    /**
     * Get a queue driver by name.
     */
    driver(name: string): IQueueDriver {
        const driver = this.drivers.get(name)
        if (!driver) {
            throw new Error(`Queue driver "${name}" is not registered`)
        }

        return driver
    }

    /**
     * Register a new driver.
     */
    extend(name: string, driver: IQueueDriver): void {
        this.drivers.set(name, driver)
    }

    /**
     * Get the default connection name.
     */
    getDefaultConnection(): string {
        return this.defaultConnection
    }

    /**
     * Set the default connection name.
     */
    setDefaultConnection(name: string): void {
        this.defaultConnection = name
    }

    /**
     * Register a connection mapping.
     */
    addConnection(name: string, driver: string): void {
        this.connections.set(name, driver)
    }
}
