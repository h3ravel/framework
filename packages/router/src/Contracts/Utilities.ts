import { ConcreteConstructor, IMiddleware, UrlRoutable } from '@h3ravel/contracts'

export type Pipe = string | (abstract new (...args: any[]) => any) | ((...args: any[]) => any) | IMiddleware

export type CompiledRouteToken =
    | ['variable', string, string, string, boolean]
    | ['text', string];

export interface RouteActionConditions {
    [key: string]: any,
    subClass: ConcreteConstructor<UrlRoutable>
}