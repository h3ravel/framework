/**
 * Serialized job data stored in the queue.
 */
export interface JobPayload {
  /** Fully qualified job handler class name. */
  job: string;

  /** Data passed to handle() method. */
  data?: any;

  /** Unique job identifier. */
  uuid?: string;

  /** Maximum number of attempts. */
  maxTries?: number;

  /** Maximum number of exception attempts. */
  maxExceptions?: number;

  /** Seconds to wait before retry (can be array for exponential backoff). */
  backoff?: number;

  /** Seconds to delay job execution. */
  delay?: number;

  /** Job timeout in seconds. */
  timeout?: number;

  /** Absolute timestamp when job should timeout. */
  retryUntil?: number;

  /** Whether to fail on timeout. */
  failOnTimeout?: boolean;

  /** Job priority (driver-specific). */
  priority?: number;

  /** Job tags (driver-specific). */
  tags?: string[];
}
