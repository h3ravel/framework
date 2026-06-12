import type { H3Event } from 'h3'
import type { IApplication } from '../Core/IApplication'
import type { IRequest } from './IRequest'
import type { IResponse } from './IResponse'
import { CONTAINER_TOKEN, createContainerToken } from '../Utilities/ContainerToken'

export abstract class IHttpContext {
    static readonly [CONTAINER_TOKEN] = createContainerToken('Http.IHttpContext')

    abstract app: IApplication
    abstract event: H3Event
    abstract request: IRequest
    abstract response: IResponse
    /**
     * Retrieve an existing HttpContext instance for an event, if any.
     */
    static get (event: unknown): IHttpContext | undefined {
        void event
        return
    };
    /**
     * Delete the cached context for a given event (optional cleanup).
     */
    static forget (event: unknown): void {
        void event
    };
}
