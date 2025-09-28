import { describe, it, expect } from "@jest/globals";
import { QueueManager } from "../src/QueueManager";
import { JobContract } from "../src/Contracts/JobContract";

class TestJob implements JobContract {
  public executed = false;

  async handle(): Promise<void> {
    this.executed = true;
  }

  serialize() {
    return { executed: this.executed };
  }
}

describe("Queue Drivers", () => {
  it("pushes and pops jobs from MemoryDriver", async () => {
    const manager = new QueueManager();
    const job = new TestJob();

    await manager.dispatch(job, "memory");
    const popped = await manager.get("memory").pop();

    expect(popped).not.toBeNull();
    await popped?.handle();
    expect((popped as TestJob).executed).toBe(true);
  });

  it("persists jobs in DatabaseDriver", async () => {
    const manager = new QueueManager();
    const job = new TestJob();

    await manager.dispatch(job, "database");
    const popped = await manager.get("database").pop();

    expect(popped).not.toBeNull();
    await popped?.handle();
    expect((popped as TestJob).executed).toBe(true);
  });
});
