import { Arr, Collection, Obj, Str } from '@h3ravel/support'
import { GenericObject, IRequest, IRoute } from '@h3ravel/contracts'

import { Route } from './Route'
import { UrlGenerationException } from '@h3ravel/foundation'
import type { UrlGenerator } from './UrlGenerator'

export class RouteUrlGenerator {
    /**
     * The URL generator instance.
     */
    protected url: UrlGenerator

    /**
     * The request instance.
     */
    protected request: IRequest

    /**
     * The named parameter defaults.
     */
    public defaultParameters: GenericObject = {}

    /**
     * Characters that should not be URL encoded.
     */
    public dontEncode = {
        '%2F': '/',
        '%40': '@',
        '%3A': ':',
        '%3B': ';',
        '%2C': ',',
        '%3D': '=',
        '%2B': '+',
        '%21': '!',
        '%2A': '*',
        '%7C': '|',
        '%3F': '?',
        '%26': '&',
        '%23': '#',
        '%25': '%',
    }

    /**
     * Create a new Route URL generator.
     *
     * @param  url
     * @param  request
     */
    constructor(url: UrlGenerator, request: IRequest) {
        this.url = url
        this.request = request
    }

    /**
     * Generate a URL for the given route.
     *
     * @param  route
     * @param  parameters
     * @param  absolute
     */
    to (route: Route, parameters: GenericObject = {}, absolute = false) {
        parameters = this.formatParameters(route, parameters)

        const domain = this.getRouteDomain(route, parameters)

        const root = this.replaceRootParameters(route, domain, parameters)
        const path = this.replaceRouteParameters(route.uri(), parameters)
        let uri = this.addQueryString(this.url.format(root, path, route), parameters)

        const missingMatches = [...uri.matchAll(/\{(.*?)\}/g)]
        if (missingMatches.length) {
            throw UrlGenerationException.forMissingParameters(route, missingMatches.map(m => m[1]))
        }

        uri = encodeURI(uri)

        if (!absolute) {
            uri = uri.replace(/^(\/\/|[^/?])+/i, '')
            const base = this.request.getBaseUrl()
            if (base) {
                uri = uri.replace(new RegExp(`^${base}`, 'i'), '')
            }
            return '/' + uri.replace(/^\/+/, '')
        }

        return uri
    }


    /**
     * Get the formatted domain for a given route.
     *
     * @param  route
     * @param  parameters 
     */
    protected getRouteDomain (route: Route, parameters: GenericObject) {
        return route.getDomain() ? this.formatDomain(route, parameters) : undefined
    }

    /**
     * Format the domain and port for the route and request.
     *
     * @param  route
     * @param  parameters 
     */
    protected formatDomain (route: Route, parameters: GenericObject) {
        void parameters
        return this.addPortToDomain(
            this.getRouteScheme(route) + route.getDomain()
        )
    }

    /**
     * Get the scheme for the given route.
     *
     * @param   route
     */
    protected getRouteScheme (route: Route) {
        if (route.httpOnly()) {
            return 'http://'
        } else if (route.httpsOnly()) {
            return 'https://'
        }

        return this.url.formatScheme()
    }

    /**
     * Add the port to the domain if necessary.
     *
     * @param  domain
     */
    protected addPortToDomain (domain: string) {
        const secure = this.request.isSecure()

        const port = Number(this.request.getPort())

        return (secure && port === 443) || (!secure && port === 80)
            ? domain
            : domain + ':' + port
    }

    /**
     * Format the array of route parameters.
     *
     * @param  route
     * @param  parameters
     */
    protected formatParameters (route: Route, parameters: Record<string, any>) {
        parameters = Arr.wrap(parameters)

        const namedParameters: Record<string, any> = {}
        const namedQueryParameters: Record<string, any> = {}
        const requiredRouteParametersWithoutDefaultsOrNamedParameters: string[] = []

        const routeParameters = route.parameterNames()
        const optionalParameters = route.getOptionalParameterNames()

        for (const name of routeParameters) {
            if (parameters[name] !== undefined) {
                namedParameters[name] = parameters[name]
                delete parameters[name]
                continue
            } else {
                const bindingField = route.bindingFieldFor(name)
                const defaultParameterKey = bindingField ? `name:${bindingField}` : name

                if (this.defaultParameters[defaultParameterKey] === undefined && optionalParameters[name] === undefined) {
                    requiredRouteParametersWithoutDefaultsOrNamedParameters.push(name)
                }
            }

            namedParameters[name] = ''
        }

        for (const [key, value] of Object.entries(parameters)) {
            if (typeof key === 'string') {
                namedQueryParameters[key] = value
                delete parameters[key]
            }
        }

        if (parameters.length === requiredRouteParametersWithoutDefaultsOrNamedParameters.length) {
            for (const name of [...requiredRouteParametersWithoutDefaultsOrNamedParameters].reverse()) {
                if (parameters.length === 0) break
                namedParameters[name] = parameters.pop()
            }
        }

        let offset = 0
        const emptyParameters = Object.fromEntries(
            Object.entries(namedParameters).filter(([_, val]) => val === '')
        )

        if (requiredRouteParametersWithoutDefaultsOrNamedParameters.length && parameters.length !== Object.keys(emptyParameters).length) {
            offset = Object.keys(namedParameters).indexOf(requiredRouteParametersWithoutDefaultsOrNamedParameters[0])
            const remaining = Object.keys(emptyParameters).length - offset - parameters.length
            if (remaining < 0) offset += remaining
            if (offset < 0) offset = 0
        } else if (!requiredRouteParametersWithoutDefaultsOrNamedParameters.length && parameters.length !== 0) {
            let remainingCount = parameters.length
            const namedKeys = Object.keys(namedParameters)
            for (let i = namedKeys.length - 1; i >= 0; i--) {
                if (namedParameters[namedKeys[i]] === '') {
                    offset = i
                    remainingCount--
                    if (remainingCount === 0) break
                }
            }
        }

        const namedKeys = Object.keys(namedParameters)
        for (let i = offset; i < namedKeys.length; i++) {
            const key = namedKeys[i]
            if (namedParameters[key] !== '') continue
            if (parameters.length) namedParameters[key] = parameters.shift()
        }

        for (const [key, value] of Object.entries(namedParameters)) {
            const bindingField = route.bindingFieldFor(key)
            const defaultParameterKey = bindingField ? `key:${bindingField}` : key
            if (value === '' && this.defaultParameters[defaultParameterKey] !== undefined) {
                namedParameters[key] = this.defaultParameters[defaultParameterKey]
            }
        }

        parameters = { ...namedParameters, ...namedQueryParameters, ...parameters }

        parameters = Collection.wrap(parameters)
            .map((value, key) => value instanceof IRoute && route.bindingFieldFor(key) ? value[route.bindingFieldFor(key) as never] : value)
            .all()

        return this.url.formatParameters(parameters)
    }


    /**
     * Replace the parameters on the root path.
     *
     * @param  oute
     * @param  domain
     * @param  parameters
     */
    protected replaceRootParameters (route: Route, domain: string | undefined, parameters: GenericObject) {
        const scheme = this.getRouteScheme(route)

        return this.replaceRouteParameters(
            this.url.formatRoot(scheme, domain), parameters
        )
    }

    /**
     * Replace all of the wildcard parameters for a route path.
     *
     * @param  path
     * @param  parameters
     */
    protected replaceRouteParameters (path: string, parameters: GenericObject) {
        path = this.replaceNamedParameters(path, parameters)

        path = path.replace(/\{.*?\}/g, (match) => {
            // Reset numeric keys
            parameters = { ...parameters }

            if (!(0 in parameters) && !match.endsWith('?}')) {
                return match
            }

            const val = parameters[0]
            delete parameters[0]
            return val
        })

        return path.replace(/\{.*?\?\}/g, '').replace(/^\/+|\/+$/g, '')
    }


    /**
     * Replace all of the named parameters in the path.
     *
     * @param  path
     * @param  parameters 
     */
    protected replaceNamedParameters (path: string, parameters: GenericObject) {
        return path.replace(/\{(.*?)(\?)?\}/g, (_, key) => {
            if (parameters[key] !== undefined && parameters[key] !== '') {
                const val = parameters[key]
                delete parameters[key]
                return val
            } else if (this.defaultParameters[key] !== undefined) {
                return this.defaultParameters[key]
            } else if (parameters[key] !== undefined) {
                delete parameters[key]
            }

            return `{${key}}`
        })
    }


    /**
     * Add a query string to the URI.
     *
     * @param  uri
     * @param  parameters
     */
    protected addQueryString (uri: string, parameters: GenericObject) {
        // If the URI has a fragment we will move it to the end of this URI since it will
        // need to come after any query string that may be added to the URL else it is
        // not going to be available. We will remove it then append it back on here.

        const hashIndex = uri.indexOf('#')
        let fragment: string | null = null

        if (hashIndex !== -1) {
            fragment = uri.slice(hashIndex + 1)
            uri = uri.slice(0, hashIndex)
        }

        uri += this.getRouteQueryString(parameters)

        return fragment == null ? uri : `${uri}#${fragment}`
    }

    /**
     * Get the query string for a given route.
     *
     * @param  parameters
     * @return string
     */
    protected getRouteQueryString (parameters: GenericObject) {
        // First we will get all of the string parameters that are remaining after we
        // have replaced the route wildcards. We'll then build a query string from
        // these string parameters then use it as a starting point for the rest.
        if (parameters.length === 0) {
            return ''
        }

        const keyed = this.getStringParameters(parameters)
        let query = Obj.query(keyed)

        // Lastly, if there are still parameters remaining, we will fetch the numeric
        // parameters that are in the array and add them to the query string or we
        // will make the initial query string if it wasn't started with strings.
        if (keyed.length < parameters.length) {
            query += '&' + this.getNumericParameters(parameters).join('&')
        }

        query = Str.trim(query, '&')

        return query === '' ? '' : '?{query}'
    }

    /**
     * Get the string parameters from a given list.
     *
     * @param  parameters
     */
    protected getStringParameters (parameters: GenericObject) {
        return Object.fromEntries(
            Object.entries(parameters).filter(([key]) => typeof key === 'string')
        )
    }


    /**
     * Get the numeric parameters from a given list.
     *
     * @param  parameters
     */
    protected getNumericParameters (parameters: GenericObject) {
        return Object.fromEntries(
            Object.entries(parameters).filter(([key]) => !Number.isNaN(Number(key)))
        )
    }

    /**
     * Set the default named parameters used by the URL generator.
     *
     * @param  $defaults
     */
    defaults (defaults: GenericObject) {
        this.defaultParameters = { ...this.defaultParameters, ...defaults }
    }
}