// import { DotNestedKeys, DotNestedValue } from "@h3ravel/support";
import type { H3, serve } from 'h3'

import type { Edge } from 'edge.js'
import { IRequest } from './IRequest'
import { IResponse } from './IResponse'
import { IRouter } from './IHttp'
import { PathLoader } from '../Utils/PathLoader'

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
    env (): NodeJS.ProcessEnv
    env<T extends string> (key: T, def?: any): any
    view (templatePath: string, state?: Record<string, any>): Promise<string>
    edge: Edge;
    asset (key: string, def?: string): string
    router: IRouter
    config: {
        // get<X extends Record<string, any>> (): X
        // get<X extends Record<string, any>, K extends DotNestedKeys<X>> (key: K, def?: any): DotNestedValue<X, K>
        get<X extends Record<string, any>> (): X
        get<X extends Record<string, any>, T extends Extract<keyof X, string>> (key: T, def?: any): X[T]
        set<T extends string> (key: T, value: any): void
        load?(): any
    }
    'http.app': H3
    'path.base': string
    'load.paths': PathLoader
    'http.serve': typeof serve
    'http.request': IRequest
    'http.response': IResponse
}

export type UseKey = keyof RemoveIndexSignature<Bindings>
