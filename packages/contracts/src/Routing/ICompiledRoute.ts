export declare class ICompiledRoute {
    /**
     * Get the compiled path regex
     */
    getRegex (): RegExp;
    /**
     * Get the compiled host regex (if any)
     */
    getHostRegex (): RegExp | undefined;
    /**
     * Returns list of all param names (including optional)
     */
    getParamNames (): string[];
    /**
     * Returns optional params record
     */
    getOptionalParams (): Record<string, null>;
}