import { IMiddleware } from '@h3ravel/contracts'

export type Pipe = string | (abstract new (...args: any[]) => any) | ((...args: any[]) => any) | IMiddleware

export type CompiledRouteToken =
    | ['variable', string, string, string, boolean]
    | ['text', string];