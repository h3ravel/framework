import { EventHandler } from './IHttp'

export type RouteMethod = 'get' | 'head' | 'put' | 'patch' | 'post' | 'delete'

export interface RouteDefinition {
    method: RouteMethod;
    path: string;
    name?: string | undefined;
    handler: EventHandler;
    signature: [string, string | undefined]
}
