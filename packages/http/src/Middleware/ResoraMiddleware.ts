import { IRequest } from '@h3ravel/contracts'
import { Injectable } from '@h3ravel/foundation'
import { Middleware } from '../Middleware'

export class ResoraMiddleware extends Middleware {
    @Injectable()
    async handle (request: IRequest, next: (request: IRequest) => Promise<unknown>) {
        const { applyRuntimeConfig, runWithCtx } = await import('resora')
        const { req, res } = request.context.event

        applyRuntimeConfig(Object.assign({}, config('resources'), {
            resourcesDir: 'src/app/http/resources',
            localStubsDir: 'node_modules/@h3ravel/http/stubs',
            stubs: {
                resource: 'resource.stub',
                collection: 'resource.collection.stub',
                controller: 'controller.stub',
                api: 'controller.api.stub',
                model: 'controller.model.stub',
                apiResource: 'controller.api.resource.stub',
            }
        }))

        return runWithCtx({ res, req }, () => next(request))
    }
}
