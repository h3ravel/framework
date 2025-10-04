import { EventHandlerRequest, H3Event } from 'h3'
import { Resource } from './Resource'
import { Collection } from './Collection'

export interface BaseResource {
    pagination?: {
        from?: number
        to?: number
        perPage?: number
        total?: number
    }
    [key: string]: any
}

type BodyResource = {
    data: any
    meta?: any
    links?: any
}

export class JsonResource<R extends BaseResource | Resource | Collection = any> {
    request: H3Event<EventHandlerRequest>['req']
    response: H3Event['res']
    resource: R
    body: BodyResource = { data: {} }

    private shouldSend = false
    private responseSent = false

    constructor(protected event: H3Event, rsc: R) {
        this.request = event.req
        this.response = event.res
        this.resource = rsc

        // Dynamically copy properties from Resource instances
        if (rsc instanceof Resource) {
            Object.keys(rsc.toArray()).forEach((key) => {
                if (!(key in this)) {
                    Object.defineProperty(this, key, {
                        enumerable: true,
                        configurable: true,
                        get: () => (rsc as any)[key],
                        set: (value) => ((rsc as any)[key] = value),
                    })
                }
            })
        }
    }

    /**
     * Return plain resource data
     */
    data(): any {
        if (this.resource instanceof Resource) return this.resource.toArray()
        if (this.resource instanceof Collection) return this.resource.toArray()
        return this.resource
    }

    /**
     * Build JSON response body
     */
    json(): this {
        this.shouldSend = true
        this.response.status = 200

        if (this.resource instanceof Resource) {
            this.body = { data: this.resource.toArray() }
            if (this.resource.pagination) {
                this.body.meta = { pagination: this.resource.pagination }
            }
        } else if (this.resource instanceof Collection) {
            this.body = this.resource.json()
        } else {
            // Plain object or array
            let data: any = Array.isArray(this.resource)
                ? [...this.resource]
                : { ...this.resource }

            if (typeof data.data !== 'undefined') data = data.data
            if (!Array.isArray(this.resource)) delete data.pagination

            this.body = { data }

            if (!Array.isArray(this.resource) && (this.resource as BaseResource).pagination) {
                this.body.meta = { pagination: (this.resource as BaseResource).pagination }
            }
        }

        return this
    }

    /**
     * Merge additional top-level data into JSON body
     */
    additional(data: Record<string, any>): this {
        delete data.data
        delete data.pagination
        this.body = { ...this.body, ...data }
        return this
    }

    /**
     * Send the response (stub for H3 integration)
     */
    send(): this {
        this.shouldSend = false
        if (!this.responseSent) this.#send()
        return this
    }

    status(code: number): this {
        this.response.status = code
        return this
    }

    #send() {
        if (!this.responseSent) {
            // Replace this with H3 response send if needed:
            // e.g., this.response.end(JSON.stringify(this.body))
            this.responseSent = true
        }
    }

    private checkSend() {
        if (this.shouldSend && !this.responseSent) this.#send()
    }
}
