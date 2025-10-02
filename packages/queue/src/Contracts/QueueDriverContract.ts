import { JobContract } from '../Contracts/JobContract';

export interface QueueDriverContract {
  push(job: JobContract): any;
  pop(queue?: string): Promise<JobContract | null> | JobContract | null;
  size(queue?: string): Promise<number> | number;
  release(job: JobContract, delay?: number): void;
}