import { IMiddleware } from '..'

export type RedirectHandler = string | (() => string);
export type MiddlewareIdentifier = string | IMiddleware;
export type MiddlewareList = MiddlewareIdentifier[];