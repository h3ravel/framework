import { IApplication, IUrlGenerator, RouteParams } from '@h3ravel/contracts'

export class Helpers {
    private static app: IApplication
    private static helpersLoaded: boolean

    static load (app: IApplication) {
        this.app = app
        this.loadHelpers()
    }

    static isLoaded () {
        return this.helpersLoaded
    }

    /**
     * Get the available app instance.
     * 
     * @param key
     */
    private static appInstance () {
        return (key?: any) => {
            if (key) {
                return this.app.make(key)
            }

            return this.app
        }
    }

    /**
     * Get an instance of the Request class
     * 
     * @returns — a global instance of the Request class.
     */
    private static request () {
        return () => this.app.make('http.request')
    }

    /**
     * Get an instance of the Response class
     * 
     * @returns — a global instance of the Response class.
     */
    private static response () {
        return () => this.app.make('http.response')
    }

    /**
     * Get an instance of the current session manager
     * @param key
     * @param defaultValue
     * 
     * @returns — a global instance of the current session manager.
     */
    private static session () {
        const req = this.request()

        return (...args: any[]) => Reflect.apply(req, req, []).session(...args)
    }

    /**
     * Get the flashed input from previous request.
     * 
     * @param args 
     */
    private static old () {
        const req = this.request()

        return (...args: any[]) => Reflect.apply(req, req, []).old(args?.[0], args?.[1])
    }

    /**
     * Hash the given value against the bcrypt algorithm.
     *
     * @param  value
     * @param  options
     */
    private static bcrypt () {
        return (value: string, options: any) => this.app.make('hash').make(value, options)
    }

    /**
     * Global env variable
     * 
     * @param path
     */
    private static env () {
        return (...args: any[]) => Reflect.apply(this.app.make('env'), undefined, args)
    }

    private static config () {
        return ((key?: string | Record<string, any>, defaultValue?: any) => {
            if (!key || typeof key === 'string') {
                return this.app.make('config').get(key, defaultValue)
            }

            Object.entries(key).forEach(([key, value]) => {
                this.app.make('config').set(key, value)
            })
        })
    }

    /**
     * Generate the URL to a named route.
     *
     * @param  name
     * @param  parameters
     * @param  absolute
     */
    private static route () {
        return (name: string, parameters?: RouteParams, absolute = true) => {
            return this.app.make('url').route(name, parameters, absolute)
        }
    }

    /**
     * Get the evaluated view contents for the given view.
     */
    private static view () {
        return (...args: any[]) => Reflect.apply(this.app.make('view'), undefined, args)
    }

    /**
     * Get static asset
     */
    private static asset () {
        return (...args: any[]) => Reflect.apply(this.app.make('asset'), undefined, args)
    }

    private static url () {
        return (path?: string, parameters: (string | number)[] = [], secure?: boolean): any => {
            if (!path) {
                return this.app.make(IUrlGenerator)
            }

            return this.app.make(IUrlGenerator).to(path, parameters, secure)
        }
    }

    /**
     * Load all global helpers
     */
    private static loadHelpers () {
        globalThis.request ??= this.request()
        globalThis.response ??= this.response()
        globalThis.session ??= this.session()
        globalThis.old ??= this.old()
        globalThis.bcrypt ??= this.bcrypt()
        globalThis.env ??= this.env()
        globalThis.config ??= this.config()
        globalThis.view = this.view()
        globalThis.url = this.url()
        globalThis.app ??= this.appInstance()
        globalThis.route = this.route()
        globalThis.asset = this.asset()
    }
}