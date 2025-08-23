export { }

declare global {
    /**
     * Dump something and kill the process for quick debugging. Based on Laravel's dd()
     * 
     * @param args 
     */
    function dd (...args: any[]): never
    /**
     * Dump something but keep the process for quick debugging. Based on Laravel's dump()
     * 
     * @param args 
     */
    function dump (...args: any[]): void
}
