import { Application } from "@h3ravel/core";
import { Queue } from "./Contracts/Queue";
import { SyncDriver } from "./Drivers/SyncDriver";
import { ArrayDriver } from "./Drivers/ArrayDriver";

export class QueueManager {
  protected app: Application;
  protected connections: Map<string, Queue> = new Map();
  protected static customDrivers: Map<string, Queue> = new Map();

  constructor(app: Application) {
    this.app = app;
  }

  public connection(name?: string): Queue {
    name = name ?? this.getDefaultDriver();

    if (!this.connections.has(name)) {
      this.connections.set(name, this.resolve(name));
    }

    return this.connections.get(name)!;
  }

  protected getDefaultDriver(): string {
    return this.app.make<any>('config').get("queue.default", "sync");
  }

  protected resolve(name: string): Queue {
    if (QueueManager.customDrivers.has(name)) {
      return QueueManager.customDrivers.get(name)!;
    }

    const config = this.app.make<any>('config').get(`queue.connections.${name}`);

    if (!config) {
      throw new Error(`Queue connection [${name}] not configured.`);
    }

    const driverMethod = `create${name.charAt(0).toUpperCase() + name.slice(1)}Driver`;

    if (typeof (this as any)[driverMethod] === "function") {
      return (this as any)[driverMethod](config);
    }

    throw new Error(`Unsupported driver [${name}].`);
  }

  protected createSyncDriver(config: any): Queue {
    return new SyncDriver();
  }

  protected createArrayDriver(config: any): Queue {
    return new ArrayDriver();
  }

  public push(job: any, payload?: any, queue?: string): Promise<any> {
    return this.connection(queue).push(job, payload, queue);
  }

  public later(delay: number, job: any, payload?: any, queue?: string): Promise<any> {
    return this.connection(queue).later(delay, job, payload, queue);
  }

  public static addDriver(name: string, driver: Queue): void {
    QueueManager.customDrivers.set(name, driver);
  }

  public static dispatch(job: any, queue?: string): Promise<any> {
    return Application.getInstance().make<QueueManager>('queue').push(job, undefined, queue);
  }

  public static via(name: string): Queue {
    return Application.getInstance().make<QueueManager>('queue').connection(name);
  }
}