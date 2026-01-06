import { InvalidArgumentException } from '@h3ravel/support'

/**
 * Exception thrown when a route does not exist.
 */
export class RouteNotFoundException extends InvalidArgumentException implements Error {
}