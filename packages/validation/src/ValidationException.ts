import { IHttpResponse, IRequest } from '@h3ravel/contracts'

import { MessageBag } from './utilities/MessageBag'
import { Str } from '@h3ravel/support'
import { UnprocessableEntityHttpException } from '@h3ravel/foundation'
import { Validator } from './Validator'

export class ValidationException extends UnprocessableEntityHttpException {
    public validator: Validator<any, any>
    public response?: any
    public status: number = 422
    public errorBag: string = 'default'
    public redirectTo?: string

    constructor(validator: Validator<any, any>, response: any = null, errorBag = 'default') {
        super(ValidationException.summarize(validator))

        this.name = 'ValidationException'
        this.validator = validator
        this.response = response
        this.errorBag = errorBag
        Object.setPrototypeOf(this, ValidationException.prototype)
    }

    /**
     * Send a custom response body for this exception
     * 
     * @param request 
     * @returns 
     */
    public toResponse (request: IRequest) {
        if (!request.expectsJson()) {
            session().flash('_errors', this.errors())
            session().flash('_old', request.all())

            return response()
                .setCharset('utf-8')
                .redirect(request.getHeader('referer') || '/', 302)
        }

        return {
            message: this.message,
            errors: this.errors(),
        }
    }

    /**
     * Create a new validation exception from a plain array of messages.
     */
    public static withMessages (
        messages: Record<string, string[] | string>
    ): ValidationException {
        const validator = new Validator({}, {})
        const bag = new MessageBag()

        for (const [key, value] of Object.entries(messages)) {
            const list = Array.isArray(value) ? value : [value]
            for (const message of list) {
                bag.add(key, message)
            }
        }

        (validator as any)._errors = bag

        return new ValidationException(validator)
    }

    /**
     * Create a readable summary message from the validation errors.
     */
    protected static summarize (validator: Validator<any, any>): string {
        const messages = validator.errors().all()

        if (!messages.length || typeof messages[0] !== 'string') {
            return 'The given data was invalid.'
        }

        let message = messages.shift()!
        const count = messages.length

        if (count > 0) {
            message += ` (and ${count} more ${Str.plural('error', count)})`
        }

        return message
    }

    /**
     * Get all of the validation error messages.
     */
    public errors (): Record<string, string[]> {
        return this.validator.errors().getMessages()
    }

    /**
     * Set the HTTP status code to be used for the response.
     */
    public setStatus (status: number): this {
        this.status = status
        return this
    }

    /**
     * Set the error bag on the exception.
     */
    public setErrorBag (errorBag: string): this {
        this.errorBag = errorBag
        return this
    }

    /**
     * Set the URL to redirect to on a validation error.
     */
    public setRedirectTo (url: string): this {
        this.redirectTo = url
        return this
    }

    /**
     * Get the underlying response instance.
     */
    public getResponse (): any {
        return this.response
    }
}