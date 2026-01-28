import { Queue, Worker, ConnectionOptions, JobsOptions } from 'bullmq'
import { IQueueDriver, IJob, JobPayload } from '@h3ravel/contracts'
import { Container } from '@h3ravel/core'
import { BullMQJob } from '../Jobs/BullMQJob'

/**
 * Redis connection configuration for BullMQ.
 */
export interface BullMQRedisConfig {
    host?: string
    port?: number
    password?: string
    db?: number | string
    username?: string
    url?: string
}

/**
 * BullMQ queue driver implementation.
 */
export class BullMQDriver extends IQueueDriver {
    /**
     * Map of queue names to BullMQ Queue instances.
     */
    protected queues: Map<string, Queue> = new Map()

    /**
     * Map of connection names to Redis connection options.
     */
    protected connections: Map<string, ConnectionOptions> = new Map()

    /**
     * Map of queue keys to Worker instances for pop operations.
     */
    protected workers: Map<string, Worker> = new Map()

    /**
     * The default connection name.
     */
    protected defaultConnection: string

    /**
     * The service container.
     */
    protected container: Container

    /**
     * Create a new BullMQ driver instance.
     *
     * @param redisConfig Redis connection configuration
     * @param defaultConnection Default connection name
     * @param container Service container
     */
    constructor(
        redisConfig: BullMQRedisConfig | Record<string, BullMQRedisConfig>,
        defaultConnection: string = 'default',
        container: Container,
    ) {
        super()
        this.defaultConnection = defaultConnection
        this.container = container

        // If a single config object is provided, use it for the default connection
        if (!('host' in redisConfig) && !('url' in redisConfig)) {
            // Multiple connections provided
            for (const [name, config] of Object.entries(redisConfig)) {
                this.connections.set(name, this.buildConnectionOptions(config))
            }
        } else {
            // Single connection config
            this.connections.set(defaultConnection, this.buildConnectionOptions(redisConfig as BullMQRedisConfig))
        }
    }

    /**
     * Build BullMQ connection options from Redis config.
     */
    protected buildConnectionOptions(config: BullMQRedisConfig): ConnectionOptions {
        const options: ConnectionOptions = {}

        if (config.url) {
            // If URL is provided, use it directly
            return { host: config.url } as ConnectionOptions
        }

        options.host = config.host || '127.0.0.1'
        options.port = config.port || 6379
        if (config.password) {
            options.password = config.password
        }
        if (config.username) {
            options.username = config.username
        }
        if (config.db !== undefined) {
            options.db = typeof config.db === 'string' ? parseInt(config.db, 10) : config.db
        }

        return options
    }

    /**
     * Get or create a Queue instance for the given queue name and connection.
     */
    protected getQueue(queue: string, connection?: string): Queue {
        const connectionName = connection || this.defaultConnection
        const queueKey = `${connectionName}:${queue}`
        const connOptions = this.connections.get(connectionName)

        if (!connOptions) {
            throw new Error(`Redis connection "${connectionName}" not found`)
        }

        if (!this.queues.has(queueKey)) {
            const bullQueue = new Queue(queue, {
                connection: connOptions,
            })
            this.queues.set(queueKey, bullQueue)
        }

        return this.queues.get(queueKey)!
    }

    /**
     * Get or create a Worker instance for pop operations.
     * Workers are kept alive per queue to handle job lifecycle properly.
     */
    protected getWorker(queue: string, connection?: string): Worker {
        const connectionName = connection || this.defaultConnection
        const queueKey = `${connectionName}:${queue}`
        const connOptions = this.connections.get(connectionName)

        if (!connOptions) {
            throw new Error(`Redis connection "${connectionName}" not found`)
        }

        if (!this.workers.has(queueKey)) {
            // Create a worker with minimal concurrency for manual job fetching
            // We'll use getNextJob() to manually fetch jobs
            const worker = new Worker(
                queue,
                async () => {
                    // Empty processor - jobs will be handled manually via getNextJob
                    // This should never be called since we use getNextJob directly
                },
                {
                    connection: connOptions,
                    concurrency: 1, // Allow one job to be active at a time
                    limiter: {
                        max: 0, // Disable automatic rate limiting
                        duration: 1000,
                    },
                },
            )
            // Pause the worker to prevent automatic job processing
            // We'll manually fetch jobs using getNextJob()
            worker.pause()
            this.workers.set(queueKey, worker)
        }

        return this.workers.get(queueKey)!
    }

    /**
     * Convert JobPayload options to BullMQ JobsOptions.
     */
    protected buildJobOptions(payload: JobPayload): JobsOptions {
        const options: JobsOptions = {}

        // Map maxTries to attempts
        if (payload.maxTries !== undefined) {
            options.attempts = payload.maxTries
        }

        // Map backoff (convert seconds to milliseconds)
        if (payload.backoff !== undefined) {
            if (typeof payload.backoff === 'number') {
                options.backoff = {
                    type: 'exponential',
                    delay: payload.backoff * 1000,
                }
            } else if (Array.isArray(payload.backoff)) {
                // Array of delays for exponential backoff
                options.backoff = {
                    type: 'exponential',
                    delay: payload.backoff.map((delay) => delay * 1000),
                }
            }
        }

        // Map timeout (convert seconds to milliseconds)
        if (payload.timeout !== undefined) {
            options.timeout = payload.timeout * 1000
        }

        // Map delay (convert seconds to milliseconds)
        if (payload.delay !== undefined) {
            options.delay = payload.delay * 1000
        }

        // Map priority
        if (payload.priority !== undefined) {
            options.priority = payload.priority
        }

        // Map tags
        if (payload.tags !== undefined && payload.tags.length > 0) {
            options.tags = payload.tags
        }

        // Handle retryUntil - BullMQ doesn't have direct support,
        // but we can check it in the job processor
        if (payload.retryUntil !== undefined) {
            options.jobId = payload.uuid
        }

        // Use UUID as job ID if provided
        if (payload.uuid) {
            options.jobId = payload.uuid
        }

        return options
    }

    /**
     * Push a job onto the queue.
     */
    async push(queue: string, payload: JobPayload, connection?: string): Promise<string> {
        const bullQueue = this.getQueue(queue, connection)
        const options = this.buildJobOptions(payload)

        const job = await bullQueue.add('job', payload, options)
        return job.id!
    }

    /**
     * Push a delayed job onto the queue.
     */
    async later(queue: string, payload: JobPayload, delay: number, connection?: string): Promise<string> {
        const bullQueue = this.getQueue(queue, connection)
        const options = this.buildJobOptions(payload)

        // Override delay (convert seconds to milliseconds)
        options.delay = delay * 1000

        const job = await bullQueue.add('job', payload, options)
        return job.id!
    }

    /**
     * Push multiple jobs onto the queue.
     */
    async bulk(queue: string, payloads: JobPayload[], connection?: string): Promise<(string | number | void)[]> {
        const bullQueue = this.getQueue(queue, connection)

        const jobs = payloads.map((payload) => ({
            name: 'job',
            data: payload,
            opts: this.buildJobOptions(payload),
        }))

        const addedJobs = await bullQueue.addBulk(jobs)
        return addedJobs.map((job) => job.id!)
    }

    /**
     * Pop a job from the queue.
     */
    async pop(queue: string, connection?: string): Promise<IJob | null> {
        const connectionName = connection || this.defaultConnection
        const worker = this.getWorker(queue, connection)

        try {
            // Use Worker's getNextJob to manually fetch the next job
            // This will automatically move the job to "active" state
            // The worker is paused, so this is the only way jobs are processed
            const bullMQJob = await worker.getNextJob()

            if (!bullMQJob) {
                return null
            }

            // Wrap the BullMQ job in our BullMQJob wrapper
            return new BullMQJob(bullMQJob, connectionName, queue, this.container)
        } catch (error) {
            // If there's an error getting the job, return null
            return null
        }
    }

    /**
     * Get the size of the queue.
     */
    async size(queue: string, connection?: string): Promise<number> {
        const bullQueue = this.getQueue(queue, connection)
        const counts = await bullQueue.getJobCounts('waiting', 'active', 'delayed')
        return (counts.waiting || 0) + (counts.active || 0) + (counts.delayed || 0)
    }

    /**
     * Clear the queue.
     */
    async clear(queue: string, connection?: string): Promise<void> {
        const bullQueue = this.getQueue(queue, connection)
        await bullQueue.obliterate({ force: true })
    }

    /**
     * Clean up resources.
     */
    async close(): Promise<void> {
        // Close all queues
        for (const queue of this.queues.values()) {
            await queue.close()
        }
        this.queues.clear()

        // Close all workers
        for (const worker of this.workers.values()) {
            await worker.close()
        }
        this.workers.clear()
    }
}
