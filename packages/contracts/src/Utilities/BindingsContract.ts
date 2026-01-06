import type { H3, serve } from 'h3'
import { IResponsable, IResponse } from '../Http/IResponse'

import type { Edge } from 'edge.js'
import { IDispatcher } from '../Events/IDispatcher'
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
    db: any
    env (): NodeJS.ProcessEnv
    env<T extends string> (key: T, def?: any): any
    view (viewPath: string, params?: Record<string, any>): Promise<IResponsable>
    edge: Edge;
    asset (key: string, def?: string): string
    router: IRouter
    events: IDispatcher
    config: {
        get<X extends Record<string, any>> (): X
        get<X extends Record<string, any>, T extends Extract<keyof X, string>> (key: T, def?: any): X[T]
        set<T extends string> (key: T, value: any): void
        load?(): any
    }
    'app.events': IDispatcher
    'http.app': H3
    'path.base': string
    'load.paths': PathLoader
    'http.serve': typeof serve
    'http.context': IHttpContext
    'http.request': IRequest
    'http.response': IResponse
}

export type UseKey<X extends Record<string, any> = Record<string, any>> = keyof RemoveIndexSignature<Bindings & X>

export type IBinding = UseKey | (new (...args: any[]) => unknown)