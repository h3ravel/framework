/// <reference path="../../../core/src/app.globals.d.ts" />

import { H3, serve } from 'h3'

import { FireCommand } from '../Commands/FireCommand'
import { ServiceProvider } from '@h3ravel/core'

/**
 * Sets up HTTP kernel and request lifecycle.
 * 
 * Register Request, Response, and Middleware classes.
 * Configure global middleware stack.
 * Boot HTTP kernel.
 * 
 * Auto-Registered
 */
export class HttpServiceProvider extends ServiceProvider {
    public static priority = 998

    register () {
        this.app.singleton('http.app', () => {
            return new H3()
        })

        this.app.singleton('http.serve', () => serve)
        this.commands([FireCommand])
    }
}
