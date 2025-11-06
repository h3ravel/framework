import { type HttpContext } from '@h3ravel/shared'
import { Model } from '@h3ravel/database'

export class Helpers {
    /**
     * Extracts parameter names from a route path string.
     *
     * - Looks for segments prefixed with ":" (e.g. "/users/:id")
     * - Captures only the param name (without the ":")
     * - Returns all matches in order of appearance
     *
     * @param path - The route path string (e.g. "/groups/:group/users/:user")
     * @returns An array of parameter names (e.g. ["group", "user"])
     */
    static extractParams (path: string): string[] {
        const regex = /:([^/]+)/g
        const params: string[] = []
        let match: RegExpExecArray | null

        while ((match = regex.exec(path)) !== null) {
            params.push(match[1])
        }

        return params
    }

    /**
     * Resolves route model binding for a given path, HTTP context, and model.
     * 
     * - Extracts all route parameters from the given path
     * - If a parameter matches the model name, it attempts to resolve the model binding
     *   using the provided value and binding field (defaults to "id" unless specified).
     * - For non-matching parameters, it simply returns the key-value pair as is.
     * - If no parameters are found, returns an empty object.
     *
     * @param path - The route path (e.g. "/groups/:group/users/:user")
     * @param ctx - The HTTP context containing the request
     * @param model - The model instance to resolve bindings against
     * @returns A resolved model instance or an object containing param values
     */
    static async resolveRouteModelBinding (path: string, ctx: HttpContext, model: Model): Promise<any> {
        const name = model.constructor.name.toLowerCase()
        /**
         * Extract field (defaults to 'id' if not specified after '|')
         */
        const field = name.split('|').at(1) ?? 'id'

        /**
         * Iterate through extracted parameters from the path
         */
        for await (const e of Helpers.extractParams(path)) {
            const value = ctx.request.params[e] ?? null
            if (e === name) return await model.resolveRouteBinding(value, field)
            else return { [e]: ctx.request.params[e] ?? {} }
        }

        return {}
    }
}
