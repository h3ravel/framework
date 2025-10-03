/// <reference path="../../../core/src/app.globals.d.ts" />

import { H3, serve } from 'h3'

import { FireCommand } from '../Commands/FireCommand'
import { ServiceProvider } from '@h3ravel/core'
import { Url } from '../Url'

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
        /** Bind HTTP APP to the service container */
        this.app.singleton('http.app', () => {
            return new H3()
        })

        /** Bind the HTTP server to the service container */
        this.app.singleton('http.serve', () => serve)

        /** Bind Url class to the service container */
        this.app.singleton('app.url', () => {
            return new Url()
        })

        /** Register Musket Commands */
        this.commands([FireCommand])
    }

    boot () {
        globalThis.url = (...args: any[]) => {
            const urlInstance = this.app.make('app.url') as Url
            if (args.length === 0) {
                return urlInstance
            }
            return urlInstance.to(args[0])
        }
    }
}
