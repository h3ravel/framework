import { IJob } from "./IJob";
import { JobPayload } from "./Utils";

/**
 * Queue driver contract for queue backends.
 * Methods can be sync or async (return T | Promise<T>).
 */
export abstract class IQueueDriver {
  abstract push(
    queue: string,
    payload: JobPayload,
    connection?: string,
  ): string | number | void | Promise<string | number | void>;

  abstract later(
    queue: string,
    payload: JobPayload,
    delay: number,
    connection?: string,
  ): string | number | void | Promise<string | number | void>;

  abstract bulk(
    queue: string,
    payloads: JobPayload[],
    connection?: string,
  ): (string | number | void)[] | Promise<(string | number | void)[]>;

  abstract pop(
    queue: string,
    connection?: string,
  ): IJob | null | Promise<IJob | null>;

  abstract size?(queue: string, connection?: string): number | Promise<number>;

  abstract clear?(queue: string, connection?: string): void | Promise<void>;
}
