import { QueueManager } from '../QueueManager';

export class QueueWorker {
  public async run(driver: string, queue?: string) {
    const queueDriver = QueueManager.via(driver);

    while (true) {
      const job = await queueDriver.pop(queue);

      if (job) {
        try {
          await job.handle();
        } catch (error) {
          if (job.attempts && job.attempts > 0) {
            job.attempts--;
            await this.release(driver, job, job.backoff || 0);
          } else {
            this.markAsFailed(job);
            if (job.failed) {
              job.failed(error as Error);
            }
          }
          console.error(error);
        }
      } else {
        // If no job is found, wait for a second before trying again.
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  }

  protected async release(driver: string, job: any, delay: number) {
    const queueDriver = QueueManager.via(driver);
    await queueDriver.release(job, delay);
  }

  protected markAsFailed(job: any) {
    // For now, we'll just log the failed job.
    // Later, we can move it to a dead-letter queue.
    console.log('Job failed:', job);
  }
}