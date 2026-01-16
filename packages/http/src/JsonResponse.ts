import { ClassConstructor, GenericObject, IApplication } from '@h3ravel/contracts'

import { InvalidArgumentException } from '@h3ravel/support'
import { Response } from './Response'
import { ResponseCodes } from '@h3ravel/foundation'

type Data = string | number | GenericObject | ClassConstructor | any[]

/**
 * Response represents an HTTP response in JSON format.
 *
 * Note that this class does not force the returned JSON content to be an
 * object. It is however recommended that you do return an object as it
 * protects yourself against XSSI and JSON-JavaScript Hijacking.
 *
 * @see https://github.com/OWASP/CheatSheetSeries/blob/master/cheatsheets/AJAX_Security_Cheat_Sheet.md#always-return-json-with-an-object-on-the-outside
 */
export class JsonResponse extends Response {
    protected data!: Data

    protected callback?: string

    /**
     * @param bool $json If the data is already a JSON string
     */
    constructor(app: IApplication, data?: Data, status: ResponseCodes = 200, headers: Record<string, (string | null)[] | string> = {}, json = false) {
        super(app, '', status, headers)

        if (json && typeof data !== 'string' && typeof data !== 'number' && typeof (data as any).toString === 'undefined') {
            throw new TypeError(`"${this.constructor.name}": If \`json\` is set to true, argument \`data\` must be a string or object implementing toString(), "${typeof data}" given.`)
        }

        data ??= {}

        if (json) this.setJson(data)
        else this.setData(data)
    }

    /**
     * Sets the JSONP callback.
     *
     * @param  callback The JSONP callback or null to use none
     *
     * @throws {InvalidArgumentException} When the callback name is not valid
     */
    setCallback (callback?: string): this {
        if (typeof callback !== 'undefined') {
            const pattern = /^[$_\p{L}][$_\p{L}\p{Mn}\p{Mc}\p{Nd}\p{Pc}\u200C\u200D]*(?:\[(?:"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|\d+)\])*?$/u


            const reserved = [
                'break', 'do', 'instanceof', 'typeof', 'case', 'else', 'new', 'var', 'catch', 'finally', 'return', 'void', 'continue', 'for', 'switch', 'while',
                'debugger', 'function', 'this', 'with', 'default', 'if', 'throw', 'delete', 'in', 'try', 'class', 'enum', 'extends', 'super', 'const', 'export',
                'import', 'implements', 'let', 'private', 'public', 'yield', 'interface', 'package', 'protected', 'static', 'null', 'true', 'false',
            ]

            const parts = callback.split('.')

            for (const part of parts) {

                if (!pattern.test(part) || reserved.includes(part)) {
                    throw new InvalidArgumentException('The callback name is not valid.')
                }
            }
        }

        this.callback = callback

        return this.update()
    }

    /**
     * Factory method for chainability.
     *
     * @example
     * 
     * return JsonResponse.fromJsonString('{"key": "value"}').setSharedMaxAge(300);
     *
     * @param  data    The JSON response string
     * @param  status  The response status code (200 "OK" by default)
     * @param  headers An array of response headers
     */
    static fromJsonString (app: IApplication, data: string, status: ResponseCodes = 200, headers: Record<string, (string | null)[] | string> = {}): JsonResponse {
        return new JsonResponse(app, data, status, headers, true)
    }

    /**
     * Sets a raw string containing a JSON document to be sent.
     * 
     * @param json 
     * @returns 
     */
    setJson (json: Data): this {
        this.data = json

        return this.update()
    }

    /**
     * Sets the data to be sent as JSON.
     * 
     * @param data 
     * @returns 
     */
    setData (data: any = {}): this {
        let content: string

        try {
            if (data.toJson === 'undefined') {
                content = JSON.stringify((data as any).toJson())
            } else if (data.toArray === 'undefined') {
                content = JSON.stringify((data as any).toArray())
            } else {
                content = JSON.stringify(data)
            }
        } catch (e: any) {
            if (e instanceof Error && e.message.startsWith('Failed calling ')) {
                throw (e as any).getPrevious() || e
            }

            throw e
        }

        return this.setJson(content)
    }

    /**
     * Get the json_decoded data from the response.
     *
     * @param  assoc
     */
    getData () {
        return JSON.parse(String(this.data))
    }

    /**
     * Sets the JSONP callback.
     *
     * @param  callback
     */
    withCallback (callback?: string) {
        return this.setCallback(callback)
    }

    /**
     * Updates the content and headers according to the JSON data and callback.
     */
    protected update (): this {
        if (typeof this.callback !== 'undefined') {
            // Not using application/javascript for compatibility reasons with older browsers.
            this.headers.set('Content-Type', 'text/javascript')

            return this.setContent(`/**/${this.callback}(${this.data});`)
        }

        // Only set the header when there is none or when it equals 'text/javascript' (from a previous update with callback)
        // in order to not overwrite a custom definition.
        if (!this.headers.has('Content-Type') || 'text/javascript' === this.headers.get('Content-Type')) {
            this.headers.set('Content-Type', 'application/json')
        }

        return this.setContent(this.data)
    }
}