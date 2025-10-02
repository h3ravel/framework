import { JobContract } from '../Contracts/JobContract';
import { QueueDriverContract } from '../Contracts/QueueDriverContract';

export class DatabaseDriver implements QueueDriverContract {
  public push(job: JobContract) {
    // TODO: Implement database logic
    return null;
  }

  public pop(): Promise<JobContract | null> {
    // TODO: Implement database logic
    return Promise.resolve(null);
  }

  public size(): Promise<number> {
    // TODO: Implement database logic
    return Promise.resolve(0);
  }
}