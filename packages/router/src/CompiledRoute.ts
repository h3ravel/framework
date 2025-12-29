export class CompiledRoute {
    private path: string
    private paramNames: string[]
    private optionalParams: Record<string, null>
    private regex: RegExp
    private hostPattern?: string
    private hostRegex?: RegExp

    constructor(path: string, paramNames: string[], optionalParams: Record<string, null>, hostPattern?: string) {
        this.path = path
        this.paramNames = paramNames
        this.optionalParams = optionalParams
        this.hostPattern = hostPattern

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
        return [...this.paramNames]
    }

    /**
     * Returns optional params record
     */
    public getOptionalParams (): Record<string, null> {
        return { ...this.optionalParams }
    }

    /**
     * Internal: build a regex from a path pattern
     */
    private buildRegex (path: string, paramNames: string[], optionalParams: Record<string, null>): RegExp {
        const regexStr = path.replace(/:([a-zA-Z0-9_]+)\??/g, (_, paramName) => {
            return optionalParams[paramName] === null ? '([^/]*)' : '([^/]+)'
        })
        return new RegExp(`^${regexStr}$`)
    }
}
