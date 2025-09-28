import { QueueDriverContract } from "../Contracts/QueueDriverContract";
import { JobContract } from "../Contracts/JobContract";

export class RedisDriver implements QueueDriverContract {
  private queue: JobContract[] = []; // stub with in-memory

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
    console.error("Redis Job failed:", error.message);
  }
}
