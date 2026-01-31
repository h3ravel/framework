import { Job as BullMQJobType } from 'bullmq'
import { Container } from '@h3ravel/core'
import { JobPayload } from '@h3ravel/contracts'
import { Job } from './Job'

/**
 * BullMQ job wrapper that implements the IJob contract.
 */
export class BullMQJob extends Job {
    protected bullMQJob: BullMQJobType
    protected rawPayload: string
    protected workerToken: string

    /**
     * @param workerToken Required for moveToFailed() state transitions
     */
    constructor(
        bullMQJob: BullMQJobType,
        connectionName: string,
        queue: string,
        container: Container,
        workerToken: string,
    ) {
        super()
        this.bullMQJob = bullMQJob
        this.connectionName = connectionName
        this.queue = queue
        this.container = container
        this.workerToken = workerToken

        const jobData = bullMQJob.data as JobPayload
        this.rawPayload = JSON.stringify(jobData)
    }

    public getJobId(): string | number | undefined {
        return this.bullMQJob.id
    }

    public getRawBody(): string {
        return this.rawPayload
    }

    public delete(): void {
        this.deleted = true
        this.bullMQJob.remove().catch(() => {})
    }

    /**
     * @param delay Delay in seconds before releasing the job
     */
    public release(delay = 0): void {
        this.released = true

        if (delay > 0) {
            this.bullMQJob.moveToDelayed(Date.now() + delay * 1000).catch(() => {})
        } else {
            this.bullMQJob.moveToWaiting().catch(() => {})
        }
    }

    /**
     * moveToFailed requires worker token as second parameter.
     */
    public fail(e: Error): void {
        super.fail(e)
        this.bullMQJob.moveToFailed(e, this.workerToken).catch(() => {})
    }
}
