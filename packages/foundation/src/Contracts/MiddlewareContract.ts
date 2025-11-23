import { IMiddleware } from '@h3ravel/shared'

export type RedirectHandler = string | (() => string);
export type MiddlewareIdentifier = string | IMiddleware;
export type MiddlewareList = MiddlewareIdentifier[];