import { Stringable } from './Helpers/Str'

export { }

declare global {
    /**
     * Dump something and kill the process for quick debugging. Based on Laravel's dd()
     * 
     * @param args 
     */
    function str (string?: string): Stringable
}
