import { Container } from '@h3ravel/core'
import { IJob } from '@h3ravel/contracts'
import { ListenerClassConstructor } from './Contracts/EventsContract'

export class QueuedListenerCalller {
    /**
     * The underlying queue job instance.
     */
    public job!: IJob

    /**
     * The listener class.
     */
    public className: ListenerClassConstructor

    /**
     * The listener method.
     */
    public method: string

    /**
     * The data to be passed to the listener.
     */
    public data: Record<string, any>

    /**
     * The number of times the job may be attempted.
     */
    public tries?: number

    /**
     * The maximum number of exceptions allowed, regardless of attempts.
     */
    public maxExceptions?: number

    /**
     * The number of seconds to wait before retrying a job that encountered an uncaught exception.
     */
    public backoff?: number

    /**
     * The timestamp indicating when the job should timeout.
     */
    public retryUntil?: number

    /**
     * The number of seconds the job can run before timing out.
     */
    public timeout?: number

    /**
     * Indicates if the job should fail if the timeout is exceeded.
     */
    public failOnTimeout?: boolean = false

    /**
     * Indicates if the job should be encrypted.
     */
    public shouldBeEncrypted?: boolean = false

    /**
     * Create a new job instance.
     *
     * @param  class
     * @param method
     * @param data
     */
    public constructor(className: ListenerClassConstructor, method: string, data: Record<string, any>) {
        this.data = data
        this.className = className
        this.method = method
    }

    /**
     * Handle the queued job.
     */
    public handle (_container: Container) {
    }

    /**
     * Set the job instance of the given class if necessary.
     *
     * @param  job
     * @param  instance
     */
    protected setJobInstanceIfNecessary (job: IJob, instance: any) {
        void job
        void instance
        return {}
    }

    /**
     * Call the failed method on the job instance.
     *
     * The event instance and the exception will be passed.
     *
     * @param  e
     */
    public failed (_e: Error) {
    }

    /**
     * Unserialize the data if needed.
     *
     * @return void
     */
    protected prepareData () {
    }

    /**
     * Get the display name for the queued job.
     *
     * @return string
     */
    public displayName () {
        return this.className
    }
}