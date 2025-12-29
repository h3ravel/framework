/// <reference path="../../../core/src/app.globals.d.ts" />

import { H3, serve } from 'h3'
import { HttpContext, Request, Response } from '..'
import { IApplication, IHttpContext, IRequest, IResponse } from '@h3ravel/contracts'

import { FireCommand } from '../Commands/FireCommand'

/**
 * Sets up HTTP kernel and request lifecycle.
 * 
 * Register Request, Response, and Middleware classes.
 * Configure global middleware stack.
 * Boot HTTP kernel.
 * 
 * Auto-Registered
 */
export class HttpServiceProvider {
    public static priority = 998
    public registeredCommands?: (new (app: any, kernel: any) => any)[]

    constructor(private app: IApplication) { }

    register () {
        /** Bind HTTP APP to the service container */
        this.app.singleton('http.app', () => {
            return new H3()
        })

        /** Bind the HTTP server to the service container */
        this.app.singleton('http.serve', () => serve)

        /** Register Musket Commands */
        this.registeredCommands = [FireCommand]

        this.app.alias([
            [Request, 'http.request'],
            [IRequest, 'http.request'],
            [Response, 'http.response'],
            [IResponse, 'http.response'],
            [HttpContext, 'http.context'],
            [IHttpContext, 'http.context'],
        ])
    }

    boot () {
    }
}
