import type { IController } from '../Core/IController'
import type { IServiceProvider } from '../Core/IServiceProvider'
import { MiddlewareList } from '../Foundation/MiddlewareContract'
import type { IHttpContext } from '../Http/IHttpContext'


export type IPathName = 'views' | 'routes' | 'assets' | 'base' | 'public' | 'storage' | 'config' | 'database'
export type RouterEnd = 'get' | 'delete' | 'put' | 'post' | 'patch' | 'apiResource' | 'group' | 'route';
export type RouteMethod = 'GET' | 'HEAD' | 'PUT' | 'PATCH' | 'POST' | 'DELETE' | 'OPTIONS';
export type RequestMethod = 'HEAD' | 'GET' | 'PUT' | 'DELETE' | 'TRACE' | 'OPTIONS' | 'PURGE' | 'POST' | 'CONNECT' | 'PATCH';
export type ControllerMethod = 'index' | 'show' | 'update' | 'destroy';
export type GenericObject = Record<string, any>;
export type RequestObject = Record<string, any>;
export type ResponseObject = Record<string, any>;

export type ExtractClassMethods<T> = {
    [K in keyof T]: T[K] extends (...args: any[]) => any ? K : never
}[keyof T];

/**
 * Type for EventHandler, representing a function that handles an H3 event.
 */
export type EventHandler = (ctx: IHttpContext) => any

export type ClassConstructor<T = any> = abstract new (...args: any[]) => T
export type RouteEventHandler = (ctx: IHttpContext, ...args: any[]) => any
export type MergedConstructor<T = any> = (new (...args: any[]) => T) & Record<string, T>
export type AbstractConstructor<T = any> = (abstract new (...args: any[]) => T) & Record<string, T>
export type CallableConstructor<X = any, Y = any> = (...args: Y[]) => X
export type AppEvent = CallableConstructor
export type AppListener = CallableConstructor
export type ConcreteConstructor<T = any> = new (...args: any[]) => Required<T>

export interface RouteActions {
    [key: string]: any
    can?: [string, string][]
    where?: Record<string, RouteEventHandler>
    domain?: string
    path?: string
    prefix?: string
    as?: string
    name?: string
    controller?: RouteEventHandler | IController | string
    missing?: CallableConstructor
    uses?: any
    http?: boolean
    https?: boolean
    middleware?: MiddlewareList
    namespace?: string
    excluded_middleware?: any
}

export interface ClassicRouteDefinition {
    method: Lowercase<RouteMethod>;
    path: string;
    name?: string | undefined;
    handler: EventHandler;
    signature: [string, string | undefined]
}

export interface RouteAttributes {
    action: RouteActions
}

export type ActionInput<C extends typeof IController = any> =
    | null
    | undefined
    | RouteEventHandler
    | IController
    | [C, methodName: ExtractClassMethods<InstanceType<C>>]
    | RouteActions


export interface NormalizedAction {
    uses: RouteEventHandler | IController | string
    controller?: RouteEventHandler | IController
    methodName?: string
}

export type ServiceProviderConstructor = (new (app: any) => IServiceProvider) & IServiceProvider;

export type AServiceProvider = (new (app: any) => IServiceProvider) & Partial<IServiceProvider>
export type OServiceProvider = (new (app: any) => Partial<IServiceProvider>) & Partial<IServiceProvider>
export type ListenerClassConstructor = (new (...args: any) => any) & {
    subscribe?(...args: any[]): any
};