import { ServiceProvider } from '@h3ravel/core'
import { IQueueManager } from '@h3ravel/contracts'
import { QueueManager } from '../QueueManager'
import { BullMQDriver, BullMQRedisConfig } from '../Drivers/BullMQDriver'

/**
 * Queues and workers.
 * 
 * Register QueueManager.
 * Load drivers (Redis, in-memory, BullMQ).
 * Register job dispatcher and workers.
 * 
 * Auto-Registered if @h3ravel/queue is installed
 */
export class QueueServiceProvider extends ServiceProvider {
    public static priority = 991

    register () {
        // Register QueueManager as singleton
        this.app.singleton('queue.manager', () => {
            return new QueueManager()
        })

        // Register BullMQ driver if Redis configuration is available
        const config = this.app.make('config')
        const redisConfig = config.get('database.redis')

        if (redisConfig) {
            // Extract Redis connection configurations
            const redisConnections: Record<string, BullMQRedisConfig> = {}

            // Process each Redis connection (default, cache, etc.)
            for (const [name, connectionConfig] of Object.entries(redisConfig)) {
                if (name !== 'client' && name !== 'options' && typeof connectionConfig === 'object') {
                    const conn = connectionConfig as any
                    redisConnections[name] = {
                        url: conn.url,
                        host: conn.host,
                        port: typeof conn.port === 'string' ? parseInt(conn.port, 10) : conn.port,
                        password: conn.password,
                        username: conn.username,
                        db: conn.database || conn.db,
                    }
                }
            }

            // Get default connection name from config or use 'default'
            const defaultConnection = config.get('queue.connection') || config.get('queue.default') || 'default'
            const redisConnectionName = config.get('queue.redis_connection') || 'default'

            // Create BullMQ driver instance
            const bullMQDriver = new BullMQDriver(
                redisConnections,
                redisConnectionName,
                this.app,
            )

            // Register BullMQ driver
            const queueManager = this.app.make<IQueueManager>('queue.manager')
            queueManager.extend('bullmq', bullMQDriver)
            queueManager.extend('redis', bullMQDriver) // Also register as 'redis' alias

            // Set default connection if configured
            if (defaultConnection) {
                queueManager.setDefaultConnection(defaultConnection)
            }
        }
    }
}
