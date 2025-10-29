/// <reference path="../../../core/src/app.globals.d.ts" />

import { Application, type ServiceProvider } from '@h3ravel/core'
import { H3, serve } from 'h3'

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

    register (this: { app: Application, registeredCommands: ServiceProvider['registeredCommands'] }, app: Application) {
        this.app = app

        /** Bind HTTP APP to the service container */
        this.app.singleton('http.app', () => {
            return new H3()
        })

        /** Bind the HTTP server to the service container */
        this.app.singleton('http.serve', () => serve)

        /** Register Musket Commands */
        this.registeredCommands = [FireCommand]
    }

    boot () {
    }
}
