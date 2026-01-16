import { Job } from '../Jobs/Job'

export class JobFailed {
    /**
     * Create a new event instance.
     *
     * @param  connectionName  The connection name.
     * @param  job  The job instance.
     * @param  exception  The exception that caused the job to fail.
     */
    constructor(
        public connectionName: string,
        public job: Job,
        public exception: Error,
    ) {
    }
}