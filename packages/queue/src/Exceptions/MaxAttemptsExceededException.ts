import { RuntimeException, tap } from '@h3ravel/support'

import { Job } from '../Jobs/Job'

export class MaxAttemptsExceededException extends RuntimeException {
    /**
     * The job instance.
     */
    public job!: Job

    /**
     * Create a new instance for the job.
     *
     * @param job
     */
    public static forJob (job: Job) {
        return tap(new MaxAttemptsExceededException(job.resolveName() + ' has been attempted too many times.'), (e) => {
            e.job = job
        })
    }
}