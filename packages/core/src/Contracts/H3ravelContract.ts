export interface EntryConfig {
    /**
     * Determines if we should initialize the app on call.
     * 
     * @default false
     */
    initialize?: boolean
    /**
     * Determines if service providers should be auto discovered and registered or not.
     * 
     * @default false
     */
    autoload?: boolean;
    /**
     * A list of service provider name strings we do not want to register at all cost
     * 
     * @default []
     */
    filteredProviders?: string[]
}