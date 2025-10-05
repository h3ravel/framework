import { Stringable } from '..'

export { }

declare global {
    /**
     * Get a new Stringable object from the given string.
     * 
     * @param string 
     */
    function str (string?: string): Stringable
}
