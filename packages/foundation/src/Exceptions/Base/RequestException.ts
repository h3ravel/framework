import { IResponse } from '@h3ravel/contracts'

export class RequestException {
    /**
     * The HTTP status code for this error.
     */
    public status!: number

    /**
     * The truncation length for the exception message.
     */
    static #truncateAt: number | false = 120

    /**
     * The response instance.
     */
    public response: IResponse

    /**
     * Create a new exception instance.
     */
    public constructor(response: IResponse) {
        // super(this.prepareMessage(response), response.getStatusCode())

        this.response = response
    }

    /**
     * Enable truncation of request exception messages.
     *
     * @return void
     */
    public static truncate () {
        RequestException.#truncateAt = 120
    }

    /**
     * Set the truncation length for request exception messages.
     *
     * @param  int  $length
     */
    public static truncateAt (length: number) {
        RequestException.#truncateAt = typeof length === 'boolean' ? 0 : Number(RequestException.#truncateAt)
    }

    /**
     * Disable truncation of request exception messages.
     *
     * @return void
     */
    public static dontTruncate () {
        RequestException.#truncateAt = false
    }

    /**
     * Prepare the exception message.
     */
    protected prepareMessage (response: IResponse) {
        const message = `HTTP request returned status code ${response.getStatusCode()}`

        // const summary = RequestException.truncateAt
        //     ? Message.bodySummary(response.toPsrResponse(), RequestException.truncateAt)
        //     : Message.toString(response.toPsrResponse())
        return message
        // return !summary ? message : message += ':\n{$summary}\n'
    }
}