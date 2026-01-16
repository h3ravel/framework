import { IContainer } from '../Core/IContainer'
import { JobPayload } from './Utils'

export abstract class IJob {
    /**
     * Get the job identifier.
     */
    abstract getJobId (): string | number | undefined;
    /**
     * Get the raw body of the job.
     */
    abstract getRawBody (): string;
    /**
     * Get the UUID of the job.
     *
     * @return string|null
     */
    abstract uuid (): string | null;
    /**
     * Fire the job.
     *
     * @return void
     */
    abstract fire (): void;
    /**
     * Delete the job from the queue.
     */
    abstract delete (): void;
    /**
     * Determine if the job has been deleted.
     */
    abstract isDeleted (): boolean;
    /**
     * Release the job back into the queue after (n) seconds.
     *
     * @param delay
     */
    abstract release (delay?: number): void;
    /**
     * Determine if the job was released back into the queue.
     *
     * @return bool
     */
    abstract isReleased (): boolean;
    /**
     * Determine if the job has been deleted or released.
     */
    abstract isDeletedOrReleased (): boolean;
    /**
     * Determine if the job has been marked as a failure.
     */
    abstract hasFailed (): boolean;
    /**
     * Mark the job as "failed".
     */
    abstract markAsFailed (): void;
    /**
     * Delete the job, call the "failed" method, and raise the failed job event.
     *
     * @param e
     */
    abstract fail (e: Error): void;
    /**
     * Get the resolved job handler instance.
     *
     * @return mixed
     */
    abstract getResolvedJob (): IJob;
    /**
     * Get the decoded body of the job.
     */
    abstract payload (): JobPayload;
    /**
     * Get the number of times to attempt a job.
     *
     * @return int|null
     */
    abstract maxTries (): number | null;
    /**
     * Get the number of times to attempt a job after an exception.
     *
     * @return int|null
     */
    abstract maxExceptions (): number | null;
    /**
     * Determine if the job should fail when it timeouts.
     *
     * @return bool
     */
    abstract shouldFailOnTimeout (): boolean;
    /**
     * The number of seconds to wait before retrying a job that encountered an uncaught exception.
     *
     * @return int|int[]|null
     */
    abstract backoff (): number | null;
    /**
     * Get the number of seconds the job can run.
     *
     * @return int|null
     */
    abstract timeout (): number | null;
    /**
     * Get the timestamp indicating when the job should timeout.
     *
     * @return int|null
     */
    abstract retryUntil (): number | null;
    /**
     * Get the name of the queued job class.
     *
     * @return string
     */
    abstract getName (): string;
    /**
     * Get the resolved display name of the queued job class.
     *
     * Resolves the name of "wrapped" jobs such as class-based handlers.
     */
    abstract resolveName (): any;
    /**
     * Get the class of the queued job.
     *
     * Resolves the class of "wrapped" jobs such as class-based handlers.
     *
     * @return string
     */
    abstract resolveQueuedJobClass (): any;
    /**
     * Get the name of the connection the job belongs to.
     */
    abstract getConnectionName (): string;
    /**
     * Get the name of the queue the job belongs to.
     */
    abstract getQueue (): string | undefined;
    /**
     * Get the service container instance.
     */
    abstract getContainer (): IContainer;
}