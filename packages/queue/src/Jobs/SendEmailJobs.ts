import { JobContract } from "../Contracts/JobContract";

export class SendEmailJob implements JobContract {
  constructor(private email: string) {}

  async handle(): Promise<void> {
    console.log(`📧 Sending email to ${this.email}`);
  }

  serialize() {
    return { email: this.email, name: "SendEmailJob" };
  }
}
