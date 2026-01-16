import { Application, ServiceProvider, h3ravel } from '@h3ravel/core'
import type { IncomingMessage, ServerResponse } from 'node:http'

import { str } from '@h3ravel/support'
import supertest from 'supertest'

const makeEvent = (overides: Record<string, any> = {}) => {
    return {
        res: { headers: new Headers(), statusCode: 200, ...(overides.res ?? {}) },
        req: { headers: new Headers(), url: overides.url ?? 'http://localhost/test', method: 'get', ...(overides.req ?? {}) },
    } as any
}


export async function supertestAdapter (app?: Application, serviceProviders: ServiceProvider[] = []) {
    let providers: ServiceProvider[] = []

    if (!app) {
        const { EventsServiceProvider } = await import(('@h3ravel/events'))
        const { HttpServiceProvider } = await import(('@h3ravel/http'))
        const { RouteServiceProvider } = await import(('@h3ravel/support'))

        providers = [EventsServiceProvider, HttpServiceProvider, RouteServiceProvider, ...serviceProviders]
    }

    const handler = async (req: IncomingMessage, res: ServerResponse) => {

        req.url = str(req.url).prepend('http://localhost').toString()

        const event = makeEvent({ req, res })

        app ??= await h3ravel(providers as never, undefined, { h3Event: event, autoload: false })

        const { response } = await app.context!(event)

        return response.getContent()
    }

    return handler
}

export const testApp = async (app?: Application, serviceProviders: ServiceProvider[] = []) => {
    return supertest(await supertestAdapter(app, serviceProviders))
}