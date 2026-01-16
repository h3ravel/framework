import { IRoute } from '../Routing/IRoute'
import { RouteParams } from './Utils'

export abstract class IRouteUrlGenerator {
    /**
     * The named parameter defaults.
     */
    abstract defaultParameters: RouteParams;

    /**
     * Characters that should not be URL encoded.
     */
    abstract dontEncode: {
        '%2F': string;
        '%40': string;
        '%3A': string;
        '%3B': string;
        '%2C': string;
        '%3D': string;
        '%2B': string;
        '%21': string;
        '%2A': string;
        '%7C': string;
        '%3F': string;
        '%26': string;
        '%23': string;
        '%25': string;
    };

    /**
     * Generate a URL for the given route.
     *
     * @param  route
     * @param  parameters
     * @param  absolute
     */
    abstract to (route: IRoute, parameters?: RouteParams, absolute?: boolean): string;

    /**
     * Set the default named parameters used by the URL generator.
     *
     * @param  $defaults
     */
    abstract defaults (defaults: RouteParams): void;
}