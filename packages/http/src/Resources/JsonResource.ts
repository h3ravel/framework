import { EventHandlerRequest, H3Event } from "h3";

export interface Resource {
    [key: string]: any;
    pagination?: {
        from?: number | undefined;
        to?: number | undefined;
        perPage?: number | undefined;
        total?: number | undefined;
    } | undefined;
}

type BodyResource = Resource & {
    data: Omit<Resource, 'pagination'>,
    meta?: {
        pagination?: Resource['pagination']
    } | undefined;
}

/**
 * Class to render API resource
 */
export class JsonResource<R extends Resource = any> {
    /**
     * The request instance
     */
    request: H3Event<EventHandlerRequest>['req'];
    /**
     * The response instance
     */
    response: H3Event['res'];
    /**
     * The data to send to the client
     */
    resource: R;
    /**
     * The final response data object
     */
    body: BodyResource = {
        data: {},
    };
    /**
     * Flag to track if response should be sent automatically
     */
    private shouldSend: boolean = false;
    /**
     * Flag to track if response has been sent
     */

    private responseSent: boolean = false;

    /**
     * Declare that this includes R's properties
     */
    [key: string]: any;

    /**
     * @param req The request instance
     * @param res The response instance
     * @param rsc The data to send to the client
     */
    constructor(protected event: H3Event, rsc: R) {
        this.request = event.req;
        this.response = event.res;
        this.resource = rsc;

        // Copy all properties from rsc to this, avoiding conflicts
        for (const key of Object.keys(rsc)) {
            if (!(key in this)) {
                Object.defineProperty(this, key, {
                    enumerable: true,
                    configurable: true,
                    get: () => this.resource[key],
                    set: (value) => {
                        (<any>this.resource)[key] = value;
                    },
                });
            }
        }
    }

    /**
     * Return the data in the expected format
     * 
     * @returns 
     */
    data (): Resource {
        return this.resource
    }

    /**
     * Build the response object
     * @returns this
     */
    json () {
        // Indicate response should be sent automatically
        this.shouldSend = true;

        // Set default status code
        this.response.status = 200;

        // Prepare body
        const resource = this.data()
        let data: Resource = Array.isArray(resource) ? [...resource] : { ...resource };

        if (typeof data.data !== 'undefined') {
            data = data.data
        }

        if (!Array.isArray(resource)) {
            delete data.pagination;
        }

        this.body = {
            data,
        };

        // Set the pagination from the data() resource, if available
        if (!Array.isArray(resource) && resource.pagination) {
            const meta: BodyResource['meta'] = this.body.meta ?? {}
            meta.pagination = resource.pagination;
            this.body.meta = meta;
        }

        // If pagination is not available on the resource, then check and set it
        // if it's available on the base resource.
        if (this.resource.pagination && !this.body.meta?.pagination) {
            const meta: BodyResource['meta'] = this.body.meta ?? {}
            meta.pagination = this.resource.pagination;
            this.body.meta = meta;
        }

        return this;
    }

    /**
     * Add context data to the response object
     * @param data Context data
     * @returns this
     */
    additional<X extends { [key: string]: any }> (data: X) {

        // Allow automatic send after additional
        this.shouldSend = true;

        // Merge data with body
        delete data.data;
        delete data.pagination;

        this.body = {
            ...this.body,
            ...data,
        };

        return this;
    }

    /**
     * Send the output to the client
     * @returns this
     */
    send () {
        this.shouldSend = false; // Prevent automatic send
        if (!this.responseSent) {
            this.#send();
        }
        return this;
    }

    /**
     * Set the status code for this response
     * @param code Status code
     * @returns this
     */
    status (code: number) {
        this.response.status = code;
        return this;
    }

    /**
     * Private method to send the response
     */
    #send () {
        if (!this.responseSent) {
            this.event.context.
                this.response.json(this.body);

            // Mark response as sent
            this.responseSent = true;
        }
    }

    /**
     * Check if send should be triggered automatically
     */
    private checkSend () {
        if (this.shouldSend && !this.responseSent) {
            this.#send();
        }
    }
}
