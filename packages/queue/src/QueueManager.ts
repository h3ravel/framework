import { QueueDriverContract } from "./Contracts/QueueDriverContract";
import { MemoryDriver } from "./Drivers/MemoryDriver";
import { RedisDriver } from "./Drivers/RedisDriver";
import { DatabaseDriver } from "./Drivers/DatabaseDriver";
import { JobContract } from "./Contracts/JobContract";

export class QueueManager {
  private drivers: Record<string, QueueDriverContract> = {};
  private defaultDriver: string = "memory";

  constructor() {
    this.register("memory", new MemoryDriver());
    this.register("redis", new RedisDriver());
    this.register("database", new DatabaseDriver());
  }

  register(name: string, driver: QueueDriverContract) {
    this.drivers[name] = driver;
  }

  get(name: string = this.defaultDriver): QueueDriverContract {
    return this.drivers[name];
  }

  async dispatch(job: JobContract, driver: string = this.defaultDriver) {
    await this.get(driver).push(job);
  }

  async pop(driver: string = this.defaultDriver): Promise<JobContract | null> {
    return this.get(driver).pop();
  }
}
