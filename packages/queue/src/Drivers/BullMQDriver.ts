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
    protected queues: Map<string, Queue> = new Map()
    protected connections: Map<string, ConnectionOptions> = new Map()
    protected workers: Map<string, Worker> = new Map()
    protected defaultConnection: string
    protected container: Container

    /**
     * @param redisConfig Single config object or Record of connection configs
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

        if ('host' in redisConfig || 'url' in redisConfig) {
            this.connections.set(defaultConnection, this.buildConnectionOptions(redisConfig as BullMQRedisConfig))
        } else {
            for (const [name, config] of Object.entries(redisConfig)) {
                this.connections.set(name, this.buildConnectionOptions(config))
            }
        }
    }

    /**
     * Build BullMQ connection options from Redis config.
     * Parses Redis URL format: redis://[username]:[password]@host:port/db
     */
    protected buildConnectionOptions(config: BullMQRedisConfig): ConnectionOptions {
        if (config.url) {
            try {
                const url = new URL(config.url)
                return {
                    host: url.hostname,
                    port: url.port ? parseInt(url.port, 10) : 6379,
                    username: url.username || undefined,
                    password: url.password || undefined,
                    db: url.pathname ? parseInt(url.pathname.slice(1), 10) : undefined,
                } as ConnectionOptions
            } catch {
                return { host: config.url } as ConnectionOptions
            }
        }

        const options: ConnectionOptions = {
            host: config.host || '127.0.0.1',
            port: config.port || 6379,
        }

        if (config.password) options.password = config.password
        if (config.username) options.username = config.username
        if (config.db !== undefined) {
            options.db = typeof config.db === 'string' ? parseInt(config.db, 10) : config.db
        }

        return options
    }

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
     * Get or create a paused Worker instance for job state transitions.
     * Worker is paused to prevent automatic processing; used only for state management.
     */
    protected getWorker(queue: string, connection?: string): Worker {
        const connectionName = connection || this.defaultConnection
        const queueKey = `${connectionName}:${queue}`
        const connOptions = this.connections.get(connectionName)

        if (!connOptions) {
            throw new Error(`Redis connection "${connectionName}" not found`)
        }

        if (!this.workers.has(queueKey)) {
            const worker = new Worker(
                queue,
                async () => {},
                {
                    connection: connOptions,
                    concurrency: 1,
                },
            )
            worker.pause()
            this.workers.set(queueKey, worker)
        }

        return this.workers.get(queueKey)!
    }

    protected getWorkerToken(queue: string, connection?: string): string {
        const connectionName = connection || this.defaultConnection
        return `bullmq-worker-${connectionName}-${queue}`
    }

    /**
     * Convert JobPayload options to BullMQ JobsOptions.
     * Converts time values from seconds to milliseconds.
     */
    protected buildJobOptions(payload: JobPayload): JobsOptions {
        const options: JobsOptions = {}

        if (payload.maxTries !== undefined) {
            options.attempts = payload.maxTries
        }

        if (payload.backoff !== undefined) {
            if (typeof payload.backoff === 'number') {
                options.backoff = {
                    type: 'exponential',
                    delay: payload.backoff * 1000,
                }
            } else if (Array.isArray(payload.backoff)) {
                options.backoff = {
                    type: 'exponential',
                    delay: payload.backoff.map((delay) => delay * 1000),
                }
            }
        }

        if (payload.timeout !== undefined) {
            options.timeout = payload.timeout * 1000
        }

        if (payload.delay !== undefined) {
            options.delay = payload.delay * 1000
        }

        if (payload.priority !== undefined) {
            options.priority = payload.priority
        }

        if (payload.tags !== undefined && payload.tags.length > 0) {
            options.tags = payload.tags
        }

        if (payload.retryUntil !== undefined) {
            options.jobId = payload.uuid
        }

        if (payload.uuid) {
            options.jobId = payload.uuid
        }

        return options
    }

    async push(queue: string, payload: JobPayload, connection?: string): Promise<string> {
        const bullQueue = this.getQueue(queue, connection)
        const options = this.buildJobOptions(payload)
        const job = await bullQueue.add('job', payload, options)
        return job.id!
    }

    async later(queue: string, payload: JobPayload, delay: number, connection?: string): Promise<string> {
        const bullQueue = this.getQueue(queue, connection)
        const options = this.buildJobOptions(payload)
        options.delay = delay * 1000
        const job = await bullQueue.add('job', payload, options)
        return job.id!
    }

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
     * Pop a job from the queue using Queue.getWaiting() for manual processing.
     */
    async pop(queue: string, connection?: string): Promise<IJob | null> {
        const connectionName = connection || this.defaultConnection
        const bullQueue = this.getQueue(queue, connection)

        try {
            const waitingJobs = await bullQueue.getWaiting(0, 1)
            if (waitingJobs.length === 0 || !waitingJobs[0]) {
                return null
            }

            const workerToken = this.getWorkerToken(queue, connection)
            return new BullMQJob(waitingJobs[0], connectionName, queue, this.container, workerToken)
        } catch {
            return null
        }
    }

    async size(queue: string, connection?: string): Promise<number> {
        const bullQueue = this.getQueue(queue, connection)
        const counts = await bullQueue.getJobCounts('waiting', 'active', 'delayed')
        return (counts.waiting || 0) + (counts.active || 0) + (counts.delayed || 0)
    }

    async clear(queue: string, connection?: string): Promise<void> {
        const bullQueue = this.getQueue(queue, connection)
        await bullQueue.obliterate({ force: true })
    }

    async close(): Promise<void> {
        for (const queue of this.queues.values()) {
            await queue.close()
        }
        this.queues.clear()

        for (const worker of this.workers.values()) {
            await worker.close()
        }
        this.workers.clear()
    }
}
