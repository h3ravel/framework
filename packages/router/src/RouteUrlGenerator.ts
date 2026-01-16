import { Collection, Obj, Str } from '@h3ravel/support'
import { IRequest, IRoute, IRouteUrlGenerator, RouteParams } from '@h3ravel/contracts'

import { UrlGenerationException } from '@h3ravel/foundation'
import type { UrlGenerator } from './UrlGenerator'

export class RouteUrlGenerator extends IRouteUrlGenerator {
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
    public defaultParameters: RouteParams = {}

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
        super()
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
    to (route: IRoute, parameters: RouteParams = {}, absolute = false) {
        parameters = this.formatParameters(route, parameters)

        const domain = this.getRouteDomain(route, parameters)

        const root = this.replaceRootParameters(route, domain, parameters)
        const path = this.replaceRouteParameters(route.uri(), parameters)

        let uri = this.addQueryString(this.url.format(root, path, route), parameters)

        const missingMatches = [...uri.matchAll(/\{([\w]+)(?:[:][\w]+)?\??\}/g)]

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
    protected getRouteDomain (route: IRoute, parameters: RouteParams) {
        return route.getDomain() ? this.formatDomain(route, parameters) : undefined
    }

    /**
     * Format the domain and port for the route and request.
     *
     * @param  route
     * @param  parameters 
     */
    protected formatDomain (route: IRoute, parameters: RouteParams) {
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
    protected getRouteScheme (route: IRoute) {
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
    protected formatParameters (route: IRoute, parameters: RouteParams) {
        parameters = Obj.wrap(parameters)
        this.defaultParameters = Obj.wrap(this.defaultParameters)

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
            if (!Str.isInteger(key)) {
                namedQueryParameters[key] = value
                delete parameters[key]
            }
        }

        if (Object.keys(parameters).length === requiredRouteParametersWithoutDefaultsOrNamedParameters.length) {
            for (const name of [...requiredRouteParametersWithoutDefaultsOrNamedParameters].reverse()) {
                if (Obj.isEmpty(parameters)) break
                namedParameters[name] = Obj.pop(parameters)
            }
        }

        let offset = 0
        const emptyParameters = Object.fromEntries(
            Object.entries(namedParameters).filter(([_, val]) => val === '')
        )

        if (requiredRouteParametersWithoutDefaultsOrNamedParameters.length && Object.keys(parameters).length !== Object.keys(emptyParameters).length) {
            offset = Object.keys(namedParameters).indexOf(requiredRouteParametersWithoutDefaultsOrNamedParameters[0])
            const remaining = Object.keys(emptyParameters).length - offset - Object.keys(parameters).length
            if (remaining < 0) offset += remaining
            if (offset < 0) offset = 0
        } else if (!requiredRouteParametersWithoutDefaultsOrNamedParameters.length && !Obj.isEmpty(parameters)) {
            let remainingCount = Object.keys(parameters).length
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
            else if (!Obj.isEmpty(parameters)) namedParameters[key] = Obj.shift(parameters)
        }

        for (const [key, value] of Object.entries(namedParameters)) {
            const bindingField = route.bindingFieldFor(key)
            const defaultParameterKey = bindingField ? `key:${bindingField}` : key
            if (value === '' && Obj.isAssoc(this.defaultParameters) && this.defaultParameters[defaultParameterKey] !== undefined) {
                namedParameters[key] = this.defaultParameters[defaultParameterKey]
            }
        }

        parameters = { ...namedParameters, ...namedQueryParameters, ...parameters }

        parameters = new Collection(parameters)
            .map((value: any, key) => value instanceof IRoute && route.bindingFieldFor(key) ? value[route.bindingFieldFor(key) as never] : value)
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
    protected replaceRootParameters (route: IRoute, domain: string | undefined, parameters: RouteParams) {
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
    protected replaceRouteParameters (path: string, parameters: RouteParams) {
        path = this.replaceNamedParameters(path, parameters)

        path = path.replace(/\{.*?\}/g, (match): any => {
            // Reset numeric keys
            parameters = { ...parameters as Record<string, any> }

            if (!(0 in parameters) && !match.endsWith('?}')) {
                return match
            }

            const val = parameters[0]
            delete parameters[0]

            return val ?? ''
        })

        return path.replace(/\{.*?\?\}/g, '').replace(/^\/+|\/+$/g, '')
    }


    /**
     * Replace all of the named parameters in the path.
     *
     * @param  path
     * @param  parameters 
     */
    protected replaceNamedParameters (path: string, parameters: RouteParams) {
        parameters = Obj.wrap(parameters)
        this.defaultParameters = Obj.wrap(this.defaultParameters)

        return path.replace(/\{([^}?]+)(\?)?\}/g, (_, key, optional): any => {
            if (parameters[key] !== undefined && parameters[key] !== '') {
                const val = parameters[key]
                delete parameters[key]
                return val
            }

            if (this.defaultParameters[key as never] !== undefined) {
                return this.defaultParameters[key as never]
            }

            if (parameters[key] !== undefined) {
                delete parameters[key]
            }

            // preserve optional param if missing
            if (optional) {
                return `{${key}?}`
            }

            // required param unresolved
            return `{${key}}`
        })
    }


    /**
     * Add a query string to the URI.
     *
     * @param  uri
     * @param  parameters
     */
    protected addQueryString (uri: string, parameters: RouteParams) {
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
    protected getRouteQueryString (parameters: RouteParams) {
        parameters = Obj.wrap(parameters)

        // First we will get all of the string parameters that are remaining after we
        // have replaced the route wildcards. We'll then build a query string from
        // these string parameters then use it as a starting point for the rest.
        if (Obj.isEmpty(parameters)) {
            return ''
        }

        const keyed = this.getStringParameters(parameters)
        let query = Obj.query(keyed)

        // Lastly, if there are still parameters remaining, we will fetch the numeric
        // parameters that are in the array and add them to the query string or we
        // will make the initial query string if it wasn't started with strings.
        if (keyed.length < Object.keys(parameters).length) {
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
    protected getStringParameters (parameters: RouteParams) {
        return Object.fromEntries(
            Object.entries(parameters).filter(([key]) => typeof key === 'string')
        )
    }


    /**
     * Get the numeric parameters from a given list.
     *
     * @param  parameters
     */
    protected getNumericParameters (parameters: RouteParams) {
        return Object.fromEntries(
            Object.entries(parameters).filter(([key]) => !Number.isNaN(Number(key)))
        )
    }

    /**
     * Set the default named parameters used by the URL generator.
     *
     * @param  $defaults
     */
    defaults (defaults: RouteParams) {
        defaults = Obj.wrap(defaults)
        this.defaultParameters = Obj.wrap(this.defaultParameters)

        this.defaultParameters = { ...this.defaultParameters, ...defaults }
    }
}