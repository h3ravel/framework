import { IRoute } from '@h3ravel/contracts'

export class UrlGenerationException extends Error {
    constructor(message: string) {
        super(message)
        this.name = 'UrlGenerationException'
    }

    static forMissingParameters (route: IRoute, parameters: string[] = []) {
        const parameterLabel = parameters.length === 1 ? 'parameter' : 'parameters'

        let message = `Missing required ${parameterLabel} for [Route: ${route.getName()}] [URI: ${route.uri()}]`

        if (parameters.length > 0) {
            message += ` [Missing ${parameterLabel}: ${parameters.join(', ')}]`
        }

        message += '.'

        return new UrlGenerationException(message)
    }
}
