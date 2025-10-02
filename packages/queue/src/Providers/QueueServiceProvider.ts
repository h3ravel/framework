import { ServiceProvider } from "@h3ravel/core";
import { QueueManager } from "../QueueManager";

export class QueueServiceProvider extends ServiceProvider {
  public register(): void {
    this.app.singleton("queue", (app) => {
      return new QueueManager(app);
    });
  }
}