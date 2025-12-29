import type { H3, serve } from 'h3'
import { IResponsable, IResponse } from '../Http/IResponse'

import type { Edge } from 'edge.js'
import { IHttpContext } from '../Http/IHttpContext'
import { IRequest } from '../Http/IRequest'
import { IRouter } from '../Routing/IRouter'
import { PathLoader } from './PathLoader'

type RemoveIndexSignature<T> = {
    [K in keyof T as string extends K
    ? never
    : number extends K
    ? never
    : K]: T[K]
}

export type Bindings = {
    [key: string]: any;
    [key: `app.${string}`]: any;
    [key: `middleware.${string}`]: any;
    env (): NodeJS.ProcessEnv
    env<T extends string> (key: T, def?: any): any
    view (viewPath: string, params?: Record<string, any>): Promise<IResponsable>
    edge: Edge;
    asset (key: string, def?: string): string
    router: IRouter
    config: {
        get<X extends Record<string, any>> (): X
        get<X extends Record<string, any>, T extends Extract<keyof X, string>> (key: T, def?: any): X[T]
        set<T extends string> (key: T, value: any): void
        load?(): any
    }
    'db': any
    'http.app': H3
    'path.base': string
    'load.paths': PathLoader
    'http.serve': typeof serve
    'http.context': IHttpContext
    'http.request': IRequest
    'http.response': IResponse
}

export type UseKey<X extends Record<string, any> = Record<string, any>> = keyof RemoveIndexSignature<Bindings & X>
