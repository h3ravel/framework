import { Job } from "../Contracts/Job";
import { Queue } from "../Contracts/Queue";

export class SyncDriver implements Queue {
  public async push(job: Job, payload?: any, queue?: string): Promise<any> {
    const jobInstance = this.resolveJob(job, payload);
    await jobInstance.handle();
  }

  public async later(delay: number, job: Job, payload?: any, queue?: string): Promise<any> {
    await new Promise(resolve => setTimeout(resolve, delay));
    return this.push(job, payload, queue);
  }

  public async size(queue?: string): Promise<number> {
    return Promise.resolve(0);
  }

  public async pop(queue?: string): Promise<any> {
    return Promise.resolve(undefined);
  }

  public async release(job: any, delay: number): Promise<void> {
    return Promise.resolve();
  }

  protected resolveJob(job: any, payload: any): Job {
    if (typeof job === 'object') {
      return job;
    }

    // Here you might want to resolve the job from a container or instantiate it
    // For now, we'll assume the job is a class constructor
    const jobInstance = new job();
    // You can pass the payload to the job instance if it has a constructor that accepts it
    // Object.assign(jobInstance, payload);
    return jobInstance;
  }
}
