export class RouteUri {
    /**
     * The route URI.
     */
    public uri: string

    /**
     * The fields that should be used when resolving bindings.
     */
    public bindingFields: Record<string, string> = {}

    /**
     * Create a new route URI instance.
     *
     * @param uri  The route URI.
     * @param bindingFields  The fields that should be used when resolving bindings.
     */
    public constructor(uri: string, bindingFields: Record<string, string> = {}) {
        this.uri = uri
        this.bindingFields = bindingFields
    }

    /**
     * Parse the given URI.
     *
     * @param  uri  The route URI.
     */
    static parse (uri: string) {
        const regex = /\{([\w:]+?)\??\}/g
        const matches = [...uri.matchAll(regex)]

        const bindingFields: Record<string, string> = {}

        for (const match of matches) {
            const fullMatch = match[0]
            const inner = match[1]

            if (!inner.includes(':')) {
                continue
            }

            const segments = inner.split(':')

            bindingFields[segments[0]] = segments[1]

            const hasOptional = fullMatch.includes('?')
            const replacement = hasOptional
                ? `{${segments[0]}?}`
                : `{${segments[0]}}`

            uri = uri.replace(fullMatch, replacement)
        }

        return new RouteUri(uri, bindingFields)
    }
}