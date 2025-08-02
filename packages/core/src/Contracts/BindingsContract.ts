import type { H3, serve } from "h3";

import type { Edge } from "edge.js";
import { PathLoader } from "../Utils/PathLoader";
import type { Router } from "@h3ravel/router";

type RemoveIndexSignature<T> = {
    [K in keyof T as string extends K
    ? never
    : number extends K
    ? never
    : K]: T[K]
}

export type Bindings = {
    [key: string]: any;
    env<T extends string> (): Record<string, any>
    env<T extends string> (key: T, def?: any): any
    view: Edge,
    router: Router
    config: {
        get<X extends Record<string, any>> (): X
        get<X extends Record<string, any>, T extends Extract<keyof X, string>> (key: T): X[T]
        set?: <T extends string>(key: T, value: any) => void
    }
    'http.app': H3
    'path.base': string
    'app.paths': PathLoader
    'http.serve': typeof serve
}

export type UseKey = keyof RemoveIndexSignature<Bindings>
