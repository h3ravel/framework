import { Request } from '.'

export { }

declare global {
    /**
     * @returns a global instance of the Request class.
     */
    function request (): Request
}
