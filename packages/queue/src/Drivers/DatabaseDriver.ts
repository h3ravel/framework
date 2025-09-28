import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { QueueDriverContract } from "../Contracts/QueueDriverContract";
import { JobContract } from "../Contracts/JobContract";

// __dirname fix for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_FILE = path.join(__dirname, "queue.json");

export class DatabaseDriver implements QueueDriverContract {
  private load(): JobContract[] {
    if (!fs.existsSync(DB_FILE)) return [];
    return JSON.parse(fs.readFileSync(DB_FILE, "utf-8"));
  }

  private save(jobs: JobContract[]): void {
    fs.writeFileSync(DB_FILE, JSON.stringify(jobs, null, 2));
  }

  async push(job: JobContract): Promise<void> {
    const jobs = this.load();
    jobs.push(job.serialize());
    this.save(jobs);
  }

  async pop(): Promise<JobContract | null> {
    const jobs = this.load();
    const jobData = jobs.shift();
    this.save(jobs);
    if (!jobData) return null;
    // In real implementation: deserialize into Job class
    return {
      ...jobData,
      handle: async () => console.log("Handle:", jobData),
      serialize: () => jobData,
    };
  }

  async release(job: JobContract): Promise<void> {
    await this.push(job);
  }

  async fail(job: JobContract, error: Error): Promise<void> {
    console.error("Job failed (DB):", error.message);
  }
}
