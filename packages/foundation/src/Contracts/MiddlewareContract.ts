import { IMiddleware } from '@h3ravel/contracts'

export type RedirectHandler = string | (() => string);
export type MiddlewareIdentifier = string | IMiddleware;
export type MiddlewareList = MiddlewareIdentifier[];