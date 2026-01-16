export interface JobPayload {
    maxTries?: number;
    maxExceptions?: number;
    failOnTimeout?: boolean;
    timeout?: number;
    retryUntil?: number;
    job: string;
    backoff?: number;
    delay?: number;
    data?: any;
    uuid?: string;
}