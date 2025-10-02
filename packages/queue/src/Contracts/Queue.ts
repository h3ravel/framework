import { Job } from "./Job";

export interface Queue {
  push(job: Job, payload?: any, queue?: string): Promise<any>;
  later(delay: number, job: Job, payload?: any, queue?: string): Promise<any>;
  size(queue?: string): Promise<number>;
  pop(queue?: string): Promise<any>;
  release(job: any, delay: number): Promise<void>;
}
