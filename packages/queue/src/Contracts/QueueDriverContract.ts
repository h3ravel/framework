import { JobContract } from "./JobContract";

export interface QueueDriverContract {
  push(job: JobContract): Promise<void>;
  pop(): Promise<JobContract | null>;
  release(job: JobContract, delay?: number): Promise<void>;
  fail(job: JobContract, error: Error): Promise<void>;
}
