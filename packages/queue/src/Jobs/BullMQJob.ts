import { Job as BullMQJobType } from 'bullmq'
import { Container } from '@h3ravel/core'
import { JobPayload } from '@h3ravel/contracts'
import { Job } from './Job'

/**
 * BullMQ job wrapper that implements the IJob contract.
 */
export class BullMQJob extends Job {
    /**
     * The BullMQ job instance.
     */
    protected bullMQJob: BullMQJobType

    /**
     * The raw job payload stored in BullMQ.
     */
    protected rawPayload: string

    /**
     * Create a new BullMQ job instance.
     *
     * @param bullMQJob The BullMQ job instance
     * @param connectionName The connection name
     * @param queue The queue name
     * @param container The service container
     */
    constructor(
        bullMQJob: BullMQJobType,
        connectionName: string,
        queue: string,
        container: Container,
    ) {
        super()
        this.bullMQJob = bullMQJob
        this.connectionName = connectionName
        this.queue = queue
        this.container = container

        // Extract and store the raw payload
        // BullMQ stores job data in job.data, which should be our JobPayload
        const jobData = bullMQJob.data as JobPayload
        this.rawPayload = JSON.stringify(jobData)
    }

    /**
     * Get the job identifier.
     */
    public getJobId(): string | number | undefined {
        return this.bullMQJob.id
    }

    /**
     * Get the raw body of the job.
     */
    public getRawBody(): string {
        return this.rawPayload
    }

    /**
     * Delete the job from the queue.
     */
    public delete(): void {
        this.deleted = true
        // BullMQ operations are async, but we mark as deleted synchronously
        // The actual removal will happen when BullMQ processes the job completion/failure
        this.bullMQJob.remove().catch(() => {
            // Ignore errors if job is already removed
        })
    }

    /**
     * Release the job back into the queue after (n) seconds.
     *
     * @param delay Delay in seconds before releasing the job
     */
    public release(delay = 0): void {
        this.released = true

        // BullMQ operations are async, but we mark as released synchronously
        if (delay > 0) {
            // Convert seconds to milliseconds for BullMQ
            const delayMs = delay * 1000
            this.bullMQJob.moveToDelayed(Date.now() + delayMs).catch(() => {
                // Ignore errors
            })
        } else {
            // Move back to waiting queue
            this.bullMQJob.moveToWaiting().catch(() => {
                // Ignore errors
            })
        }
    }

    /**
     * Delete the job, call the "failed" method, and raise the failed job event.
     *
     * @param e The error that caused the job to fail
     */
    public fail(e: Error): void {
        // Call parent fail method which handles the job failure logic synchronously
        super.fail(e)

        // Mark the BullMQ job as failed (async operation, but we don't wait)
        // BullMQ will handle the failure state automatically when the job processor throws
        // But we can also explicitly mark it as failed
        this.bullMQJob.moveToFailed(e, this.bullMQJob.id).catch(() => {
            // Job may already be in failed state, ignore
        })
    }
}
