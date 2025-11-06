import { Request, Response } from '.'

export { }

declare global {
    /**
     * @returns a global instance of the Request class.
     */
    function request (): Request
    /**
     * @returns a global instance of the Response class.
     */
    function response (): Response
}
