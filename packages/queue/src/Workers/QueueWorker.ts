import { QueueDriverContract } from "../Contracts/QueueDriverContract";
import { JobContract } from "../Contracts/JobContract";

export class QueueWorker {
  private shouldRun = true;
  constructor(private driver: QueueDriverContract, private maxRetries = 3) {}

  async start() {
    console.log("👷 Worker started...");
    while (this.shouldRun) {
      const job = await this.driver.pop();
      if (!job) {
        await new Promise(r => setTimeout(r, 1000));
        continue;
      }

      let attempts = 0;
      while (attempts < this.maxRetries) {
        try {
          await job.handle();
          console.log("✅ Job processed:", job.constructor.name);
          break;
        } catch (err) {
          attempts++;
          console.warn(`⚠️ Job failed (attempt ${attempts}):`, err);
          await new Promise(r => setTimeout(r, 1000 * attempts)); // backoff
          if (attempts >= this.maxRetries) {
            await this.driver.fail(job, err as Error);
          }
        }
      }
    }
  }

  stop() {
    this.shouldRun = false;
  }
}
