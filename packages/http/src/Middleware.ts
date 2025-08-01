import { HttpContext } from './Contracts/HttpContract';

export abstract class Middleware {
    abstract handle (context: HttpContext, next: () => Promise<unknown>): Promise<unknown>
}
