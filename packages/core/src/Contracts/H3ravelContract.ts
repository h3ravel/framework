import { H3 } from 'h3'

export interface EntryConfig {
    /**
     * @param h3 You can provide your own `H3` app instance, this is usefull when `@h3ravel/http`
     * is not installed.
     */
    h3?: H3
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
    /**
     * Overide the defined system path
     */
    customPaths?: Partial<Record<'base' | 'views' | 'assets' | 'routes' | 'config' | 'public' | 'storage' | 'database', string>>
}