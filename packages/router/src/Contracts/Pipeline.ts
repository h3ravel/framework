import { IMiddleware } from '@h3ravel/contracts'

export type Pipe = string | (abstract new (...args: any[]) => any) | ((...args: any[]) => any) | IMiddleware