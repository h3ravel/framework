export interface JobContract {
  handle(): Promise<void> | void;

  serialize(): any;
}
