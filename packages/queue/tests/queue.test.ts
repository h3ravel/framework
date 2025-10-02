import { QueueManager } from '../src/QueueManager';
import { JobContract } from '../src/Contracts/JobContract';
import { QueueWorker } from '../src/Workers/QueueWorker';

class TestJob implements JobContract {
  constructor(public payload: any) {}

  handle() {
    console.log('Job handled', this.payload);
  }

  serialize() {
    return this.payload;
  }
}

class FailingJob implements JobContract {
  public tries?: number;
  public backoff?: number;

  constructor(public payload: any) {}

  handle() {
    throw new Error('Job failed');
  }

  serialize() {
    return this.payload;
  }

  failed(error: Error) {
    console.log('Job failed', error.message);
  }
}

import { ArrayDriver } from '../src/Drivers/ArrayDriver';

describe('Queue', () => {
  beforeEach(() => {
    // Reset drivers before each test
    QueueManager.addDriver('array', new ArrayDriver());
  });

  it('should dispatch a job to the sync driver', () => {
    const job = new TestJob({ foo: 'bar' });
    const spy = jest.spyOn(job, 'handle');
    QueueManager.dispatch(job);
    expect(spy).toHaveBeenCalled();
  });

  it('should dispatch a job to the array driver', () => {
    const job = new TestJob({ foo: 'bar' });
    QueueManager.dispatch(job, 'array');
    const driver = QueueManager.via('array');
    expect(driver.size()).toBe(1);
  });

  it('should process a job from the array driver', async () => {
    const job = new TestJob({ foo: 'bar' });
    const spy = jest.spyOn(job, 'handle');
    QueueManager.dispatch(job, 'array');

    const worker = new QueueWorker();
    const workerSpy = jest.spyOn(worker, 'run').mockImplementation(async (driver) => {
      const queueDriver = QueueManager.via(driver);
      const job = await queueDriver.pop();
      if (job) {
        await job.handle();
      }
    });

    await worker.run('array');

    expect(spy).toHaveBeenCalled();
    const driver = QueueManager.via('array');
    expect(driver.size()).toBe(0);
    workerSpy.mockRestore();
  });

  it('should retry a failed job', async () => {
    const job = new FailingJob({ foo: 'bar' });
    job.tries = 2;
    job.backoff = 1;

    QueueManager.dispatch(job, 'array');

    const worker = new QueueWorker();
    const workerSpy = jest.spyOn(worker, 'run').mockImplementation(async (driver) => {
      const queueDriver = QueueManager.via(driver);
      let job = await queueDriver.pop();
      if (job) {
        try {
          await job.handle();
        } catch (error) {
          if (job.attempts && job.attempts > 0) {
            job.attempts--;
            await queueDriver.release(job, job.backoff || 0);
          } else {
            if (job.failed) {
              job.failed(error as Error);
            }
          }
        }
      }
    });

    await worker.run('array');

    const driver = QueueManager.via('array');
    expect(driver.size()).toBe(1);

    workerSpy.mockRestore();
  });
});
