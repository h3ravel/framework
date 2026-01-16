import { CompiledRouteToken } from './Contracts/Utilities'

export class CompiledRoute {
    private path: string
    private tokens: CompiledRouteToken
    private variables: string[]
    private paramNames: string[]
    private optionalParams: Record<string, null>
    private regex: RegExp
    private hostPattern?: string
    private hostRegex?: RegExp

    constructor(path: string, optionalParams: Record<string, null>, hostPattern?: string) {
        this.path = path
        this.variables = this.buildParams()
        this.paramNames = this.variables
        this.optionalParams = optionalParams
        this.hostPattern = hostPattern

        this.tokens = this.tokenizePath()

        // Build the main path regex
        this.regex = this.buildRegex(this.path, this.paramNames, this.optionalParams)

        // If host pattern provided, compile host regex too
        if (this.hostPattern) {
            this.hostRegex = this.buildRegex(this.hostPattern, [], {})
        }
    }

    /**
     * Get the compiled path regex
     */
    public getRegex (): RegExp {
        return this.regex
    }

    /**
     * Get the compiled host regex (if any)
     */
    public getHostRegex (): RegExp | undefined {
        return this.hostRegex
    }

    /**
     * Returns list of all param names (including optional)
     */
    public getParamNames (): string[] {
        return this.paramNames
    }

    /**
     * Returns list of all path variables
     */
    public getVariables (): string[] {
        return this.variables
    }

    /**
     * Returns list of all compiled tokens
     */
    public getTokens () {
        return this.tokens
    }

    /**
     * Returns optional params record
     */
    public getOptionalParams (): Record<string, null> {
        return { ...this.optionalParams }
    }

    /**
     * Build the route params
     * 
     * @returns 
     */
    private buildParams (): string[] {
        const paramNames: string[] = []

        // Extract all param names in order
        this.path.replace(/\{([\w]+)(?:[:][\w]+)?\??\}/g, (_, paramName) => {
            paramNames.push(paramName)
            return ''
        })

        return paramNames
    }

    /**
     * Build a regex from a path pattern
     * 
     * @param path 
     * @param paramNames 
     * @param optionalParams 
     * @returns 
     */
    private buildRegex (path: string, paramNames: string[], optionalParams: Record<string, null>): RegExp {
        const regexStr = path.replace(
            /\/?\{([a-zA-Z0-9_]+)(\?)?(?::[a-zA-Z0-9_]+)?\}/g,
            (_, paramName, optionalMark) => {
                // Check if param is optional via '?' or via optionalParams
                const isOptional = optionalMark === '?' || optionalParams[paramName] === null
                // return isOptional ? '([^/]*)' : '([^/]+)'
                if (isOptional) {
                    // Make both the slash and segment optional
                    return '(?:/([^/]+))?'
                } else {
                    // Required segment, preserve slash
                    return '/([^/]+)'
                }
            }
        )
        return new RegExp(`^${regexStr}$`)
    }

    /**
     * Tokenize the the path
     * 
     * @param optionalParams 
     * @returns 
     */
    private tokenizePath (): CompiledRouteToken {
        const tokens: CompiledRouteToken = [] as unknown as CompiledRouteToken
        const regex = /(\{([a-zA-Z0-9_]+)(\?)?(?::[a-zA-Z0-9_]+)?\})|([^{}]+)/g
        let match: RegExpExecArray | null

        while ((match = regex.exec(this.path)) !== null) {
            if (match[1]) {
                // It's a variable
                const paramName = match[2]
                const isOptional = match[3] === '?' || this.optionalParams[paramName] === null
                const prefix = match.index === 0 ? '' : '/'
                tokens.push([
                    'variable',
                    prefix,
                    '[^/]++',
                    paramName,
                    !isOptional
                ] as never)
            } else if (match[4]) {
                // It's a text part
                tokens.push(['text', match[4]] as never)
            }
        }

        return tokens
    }
}
