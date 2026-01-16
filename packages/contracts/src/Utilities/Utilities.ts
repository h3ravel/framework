import type { IController } from '../Core/IController'
import type { IServiceProvider } from '../Core/IServiceProvider'
import { MiddlewareList } from '../Foundation/MiddlewareContract'
import type { IHttpContext } from '../Http/IHttpContext'


export type IPathName = 'app' | 'src' | 'views' | 'routes' | 'assets' | 'base' | 'public' | 'storage' | 'config' | 'database' | 'commands'
export type RouterEnd = 'get' | 'delete' | 'put' | 'post' | 'patch' | 'apiResource' | 'group' | 'route' | 'any';
export type RouteMethod = 'GET' | 'HEAD' | 'PUT' | 'PATCH' | 'POST' | 'DELETE' | 'OPTIONS';
export type RequestMethod = 'HEAD' | 'GET' | 'PUT' | 'DELETE' | 'TRACE' | 'OPTIONS' | 'PURGE' | 'POST' | 'CONNECT' | 'PATCH';
export type ResourceMethod = 'index' | 'create' | 'store' | 'show' | 'edit' | 'update' | 'destroy'
export type GenericObject<X = any> = Record<string, X>;
export type RequestObject = Record<string, any>;
export type ResponseObject = Record<string, any>;

export type ExtractClassMethods<T> = {
    [K in keyof T]: T[K] extends (...args: any[]) => any ? K : never
}[keyof T];

/**
 * Type for EventHandler, representing a function that handles an H3 event.
 */
export type EventHandler = (ctx: IHttpContext) => any

export type TGeneric<V = any, K extends string = string> = Record<K, V>
export type ClassConstructor<T = any> = abstract new (...args: any[]) => T
export type MixinConstructor<T = TGeneric> = ClassConstructor<T>
export type RouteEventHandler = (ctx: IHttpContext, ...args: any[]) => any
export type MergedConstructor<T = any> = (new (...args: any[]) => T) & Record<string, T>
export type AbstractConstructor<T = any> = ClassConstructor<T> & Record<string, T>
export type CallableConstructor<X = any, Y = any> = (...args: Y[]) => X
export type AppEvent = CallableConstructor
export type AppListener = CallableConstructor
export type ConcreteConstructor<T = any, RA extends boolean = true> = new (...args: any[]) => RA extends true ? Required<T> : T

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
    missing?: any
    uses?: any
    http?: boolean
    https?: boolean
    middleware?: MiddlewareList
    namespace?: string
    excluded_middleware?: any
    scopeBindings?: boolean
    scope_bindings?: boolean
    withoutMiddleware?: any
    withoutScopedBindings?: any
}

export interface ResourceOptions {
    as?: string
    missing?: string
    prefix?: string
    names?: Record<string, string>
    middleware?: MiddlewareList
    shallow?: any
    only?: ResourceMethod[]
    except?: ResourceMethod[]
    parameters?: any
    wheres?: any
    trashed?: ResourceMethod[]
    creatable?: any
    destroyable?: any
    bindingFields?: string[]
    middleware_for?: GenericObject
    excluded_middleware?: MiddlewareList
    excluded_middleware_for?: GenericObject<MiddlewareList>
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

export type AServiceProvider = (new (app: any) => IServiceProvider) & Partial<IServiceProvider>
export type OServiceProvider = (new (app: any) => Partial<IServiceProvider>) & Partial<IServiceProvider>
export type ServiceProviderConstructor = (new (app: any) => IServiceProvider) & IServiceProvider;
export type ListenerClassConstructor = (new (...args: any) => any) & {
    subscribe?(...args: any[]): any
};