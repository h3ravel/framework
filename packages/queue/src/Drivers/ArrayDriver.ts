import { Job } from "../Contracts/Job";
import { Queue } from "../Contracts/Queue";

export class ArrayDriver implements Queue {
  protected jobs: any[] = [];

  public async push(job: Job, payload?: any, queue?: string): Promise<any> {
    this.jobs.push({ job, payload, queue });
    return Promise.resolve();
  }

  public async later(delay: number, job: Job, payload?: any, queue?: string): Promise<any> {
    return new Promise(resolve => {
      setTimeout(async () => {
        await this.push(job, payload, queue);
        resolve(undefined);
      }, delay);
    });
  }

  public async size(queue?: string): Promise<number> {
    return this.jobs.length;
  }

  public async pop(queue?: string): Promise<any> {
    return this.jobs.shift();
  }

  public async release(job: any, delay: number): Promise<void> {
    return new Promise(resolve => {
      setTimeout(async () => {
        this.jobs.unshift(job);
        resolve(undefined);
      }, delay);
    });
  }
}
