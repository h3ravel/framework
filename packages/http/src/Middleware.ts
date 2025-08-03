import { HttpContext } from './Contracts/HttpContract';
import { IMiddleware } from '@h3ravel/shared';

export abstract class Middleware implements IMiddleware {
    abstract handle (context: HttpContext, next: () => Promise<unknown>): Promise<unknown>
}
