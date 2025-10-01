export interface JobContract {
  /**
   * The number of times the job may be attempted.
   */
  tries?: number;

  /**
   * The maximum number of exceptions to allow before failing.
   */
  maxExceptions?: number;

  /**
   * The number of seconds to wait before retrying the job.
   */
  backoff?: number;

  /**
   * The number of seconds to wait before timing out the job.
   */
  timeout?: number;

  /**
   * The number of times the job has been attempted.
   */
  attempts?: number;

  /**
   * Process the job.
   */
  handle(): Promise<void> | void;

  /**
   * The job's serialized data.
   */
  serialize(): any;

  /**
   * The method to call when the job fails.
   */
  failed?(error: Error): void;
}