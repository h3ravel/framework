import { JobContract } from '../Contracts/JobContract';
import { QueueDriverContract } from '../Contracts/QueueDriverContract';

export class RedisDriver implements QueueDriverContract {
  public push(job: JobContract) {
    // TODO: Implement redis logic
    return null;
  }

  public pop(): Promise<JobContract | null> {
    // TODO: Implement redis logic
    return Promise.resolve(null);
  }

  public size(): Promise<number> {
    // TODO: Implement redis logic
    return Promise.resolve(0);
  }
}