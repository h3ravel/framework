import { Job } from '../Jobs/Job'
import { MaxAttemptsExceededException } from './MaxAttemptsExceededException'
import { tap } from '@h3ravel/support'

export class TimeoutExceededException extends MaxAttemptsExceededException {
    /**
     * Create a new instance for the job.
     *
     * @param  job
     */
    public static forJob (job: Job) {
        return tap(new TimeoutExceededException(job.resolveName() + ' has timed out.'), (e) => {
            e.job = job
        })
    }
}