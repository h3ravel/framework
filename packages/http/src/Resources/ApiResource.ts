import { JsonResource, Resource } from './JsonResource'

import { H3Event } from 'h3'

export function ApiResource (
    instance: JsonResource
) {
    return new Proxy(instance, {
        get (target, prop, receiver) {
            const value = Reflect.get(target, prop, receiver)
            if (typeof value === 'function') {
                // Intercept json, additional, and send methods
                if (prop === 'json' || prop === 'additional') {
                    return (...args: any[]) => {
                        const result = value.apply(target, args)
                        // Schedule checkSend after json or additional
                        setImmediate(() => target['checkSend']())
                        return result
                    }
                } else if (prop === 'send') {
                    return (...args: any[]) => {
                        // Prevent checkSend from firing
                        target['shouldSend'] = false

                        return value.apply(target, args)
                    }
                }
            }
            return value
        },
    })
}

export default function BaseResource<R extends Resource> (
    evt: H3Event,
    rsc: R
) {
    return ApiResource(new JsonResource<R>(evt, rsc))
}
