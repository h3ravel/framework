import type { H3, serve } from 'h3'
import { IResponsable, IResponse } from '../Http/IResponse'

import type { Edge } from 'edge.js'
import { IDispatcher } from '../Events/IDispatcher'
import { IHashManager } from '../Hashing/IHashManager'
import { IHttpContext } from '../Http/IHttpContext'
import { IRequest } from '../Http/IRequest'
import { IRouteCollection } from '../Routing/IRouteCollection'
import { IRouter } from '../Routing/IRouter'
import { ISessionDriver } from '../Session/ISessionDriver'
import { ISessionManager } from '../Session/ISessionManager'
import { IUrlGenerator } from '../Url/IUrlGenerator'
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
    url: IUrlGenerator
    view (viewPath: string, params?: Record<string, any>): Promise<IResponsable>
    edge: Edge;
    asset (key: string, def?: string): string
    hash: IHashManager
    router: IRouter
    events: IDispatcher
    routes: IRouteCollection
    config: {
        get<X extends Record<string, any>> (): X
        get<X extends Record<string, any>, T extends Extract<keyof X, string>> (key?: T, def?: any): X[T]
        set<T extends string> (key: T, value: any): void
        load?(): any
    }
    session: ISessionManager;
    'app.events': IDispatcher
    'hash.driver': ReturnType<IHashManager['driver']>
    'http.app': H3
    'http.serve': typeof serve
    'http.context': IHttpContext
    'http.request': IRequest
    'http.response': IResponse
    'load.paths': PathLoader
    'path.base': string
    'session.store': ISessionDriver
}

export type UseKey<X extends Record<string, any> = Record<string, any>> = keyof RemoveIndexSignature<Bindings & X>

export type IBinding = UseKey | (new (...args: any[]) => unknown)