import { H3Event } from 'h3'
import { HttpContext } from './HttpContext'
import { IMiddleware } from '@h3ravel/shared'

export abstract class Middleware implements IMiddleware {
    constructor(protected event?: H3Event) { }
    abstract handle (context: HttpContext, next: () => Promise<unknown>): Promise<unknown>
}
