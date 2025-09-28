import { QueueDriverContract } from "../Contracts/QueueDriverContract";
import { JobContract } from "../Contracts/JobContract";

export class MemoryDriver implements QueueDriverContract {
  private queue: JobContract[] = [];

  async push(job: JobContract): Promise<void> {
    this.queue.push(job);
  }

  async pop(): Promise<JobContract | null> {
    return this.queue.shift() ?? null;
  }

  async release(job: JobContract): Promise<void> {
    this.queue.push(job);
  }

  async fail(job: JobContract, error: Error): Promise<void> {
    console.error("Job failed:", job.constructor.name, error.message);
  }
}
