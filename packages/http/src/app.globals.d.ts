import { Url } from './Url'

export { }

declare global {
    /**
     * Generate URLs or get the Url instance
     *
     * @param path
     */
    function url (): Url
    function url (path: string): string
}
