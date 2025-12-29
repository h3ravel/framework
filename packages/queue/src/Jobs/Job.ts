import { ClassConstructor, IDispatcher, JobPayload } from '@h3ravel/contracts'

import { Container } from '@h3ravel/core'
import { JobFailed } from '../Events/JobFailed'
import { JobName } from './JobName'
import { ManuallyFailedException } from '../Exceptions/ManuallyFailedException'
import { TimeoutExceededException } from '../Exceptions/TimeoutExceededException'

export abstract class Job {
    /**
     * The job handler instance.
     */
    protected instance!: Job

    /**
     * The IoC container instance.
     */
    protected container!: Container

    /**
     * Indicates if the job has been deleted.
     */
    protected deleted: boolean = false

    /**
     * Indicates if the job has been released.
     */
    protected released: boolean = false

    /**
     * Indicates if the job has failed.
     */
    protected failed: boolean = false

    /**
     * The name of the connection the job belongs to.
     */
    protected connectionName!: string

    /**
     * The name of the queue the job belongs to.
     */
    protected queue?: string

    /**
     * Get the job identifier.
     */
    public abstract getJobId (): string | number | undefined;

    /**
     * Get the raw body of the job.
     */
    public abstract getRawBody (): string;

    /**
     * Get the UUID of the job.
     *
     * @return string|null
     */
    public uuid () {
        return this.payload()['uuid'] ?? null
    }

    /**
     * Fire the job.
     *
     * @return void
     */
    public fire () {
        const payload = this.payload()

        const [instance, method] = JobName.parse(payload['job']);

        (this.instance = this.resolve(instance))[method](this, payload['data'])
    }

    /**
     * Delete the job from the queue.
     */
    public delete () {
        this.deleted = true
    }

    /**
     * Determine if the job has been deleted.
     */
    public isDeleted () {
        return this.deleted
    }

    /**
     * Release the job back into the queue after (n) seconds.
     *
     * @param delay
     */
    public release (delay = 0) {
        this.released = true
    }

    /**
     * Determine if the job was released back into the queue.
     *
     * @return bool
     */
    public isReleased () {
        return this.released
    }

    /**
     * Determine if the job has been deleted or released.
     */
    public isDeletedOrReleased () {
        return this.isDeleted() || this.isReleased()
    }

    /**
     * Determine if the job has been marked as a failure.
     */
    public hasFailed () {
        return this.failed
    }

    /**
     * Mark the job as "failed".
     */
    public markAsFailed () {
        this.failed = true
    }

    /**
     * Delete the job, call the "failed" method, and raise the failed job event.
     *
     * @param e
     */
    public fail (e: Error) {
        this.markAsFailed()

        if (this.isDeleted()) {
            return
        }

        // const commandName = this.payload()['data']['commandName'] ?? false;

        // TODO: Handle this
        // If the exception is due to a job timing out, we need to rollback the current
        // database transaction so that the failed job count can be incremented with
        // the proper value. Otherwise, the current transaction will never commit.
        // if (e instanceof TimeoutExceededException &&
        //     commandName &&
        //     in_array(Batchable:: class, class_uses_recursive(commandName))) {
        //     const batchRepository = this.resolve(BatchRepository:: class);

        //     try {
        //         batchRepository.rollBack();
        //     } catch (e) {
        //         // ...
        //     }
        // }

        if (this.shouldRollBackDatabaseTransaction(e)) {
            this.container.make('db')
                .connection(this.container.make('config').get('queue.failed.database'))
                .rollBack(0)
        }

        try {
            // If the job has failed, we will delete it, call the "failed" method and then call
            // an event indicating the job has failed so it can be logged if needed. This is
            // to allow every developer to better keep monitor of their failed queue jobs.
            this.delete()

            this.failedJob(e)
        } finally {
            this.resolve(IDispatcher).dispatch(new JobFailed(
                this.connectionName, this, e || new ManuallyFailedException()
            ))
        }
    }

    /**
     * Determine if the current database transaction should be rolled back to level zero.
     *
     * @param  e
     */
    protected shouldRollBackDatabaseTransaction (e: Error) {
        return e instanceof TimeoutExceededException &&
            this.container.make('config').get('queue.failed.database') &&
            ['database', 'database-uuids'].includes(this.container.make('config').get('queue.failed.driver')) &&
            this.container.has('db')
    }

    /**
     * Process an exception that caused the job to fail.
     *
     * @param  e
     */
    protected failedJob (e: Error, ..._args: any[]) {
        const payload = this.payload()

        const [classInstance] = JobName.parse(payload.job)

        this.instance = this.resolve(classInstance)

        if (typeof this.instance.failed === 'function') {
            this.instance.failedJob(payload.data, e, payload.uuid ?? '', this)
        }
    }

    /**
     * Resolve the given class.
     */
    protected resolve<C extends ClassConstructor> (className: C): InstanceType<C> {
        return this.container.make(className)
    }

    /**
     * Get the resolved job handler instance.
     *
     * @return mixed
     */
    public getResolvedJob () {
        return this.instance
    }

    /**
     * Get the decoded body of the job.
     */
    public payload (): JobPayload {
        return JSON.parse(this.getRawBody())
    }

    /**
     * Get the number of times to attempt a job.
     *
     * @return int|null
     */
    public maxTries () {
        return this.payload()['maxTries'] ?? null
    }

    /**
     * Get the number of times to attempt a job after an exception.
     *
     * @return int|null
     */
    public maxExceptions () {
        return this.payload()['maxExceptions'] ?? null
    }

    /**
     * Determine if the job should fail when it timeouts.
     *
     * @return bool
     */
    public shouldFailOnTimeout () {
        return this.payload()['failOnTimeout'] ?? false
    }

    /**
     * The number of seconds to wait before retrying a job that encountered an uncaught exception.
     *
     * @return int|int[]|null
     */
    public backoff () {
        return this.payload()['backoff'] ?? this.payload()['delay'] ?? null
    }

    /**
     * Get the number of seconds the job can run.
     *
     * @return int|null
     */
    public timeout () {
        return this.payload()['timeout'] ?? null
    }

    /**
     * Get the timestamp indicating when the job should timeout.
     *
     * @return int|null
     */
    public retryUntil () {
        return this.payload()['retryUntil'] ?? null
    }

    /**
     * Get the name of the queued job class.
     *
     * @return string
     */
    public getName () {
        return this.payload()['job']
    }

    /**
     * Get the resolved display name of the queued job class.
     *
     * Resolves the name of "wrapped" jobs such as class-based handlers.
     */
    public resolveName () {
        return JobName.resolve(this.getName(), this.payload())
    }

    /**
     * Get the class of the queued job.
     *
     * Resolves the class of "wrapped" jobs such as class-based handlers.
     *
     * @return string
     */
    public resolveQueuedJobClass () {
        return JobName.resolveClassName(this.getName(), this.payload())
    }

    /**
     * Get the name of the connection the job belongs to.
     */
    public getConnectionName () {
        return this.connectionName
    }

    /**
     * Get the name of the queue the job belongs to.
     */
    public getQueue () {
        return this.queue
    }

    /**
     * Get the service container instance.
     */
    public getContainer () {
        return this.container
    }
}
