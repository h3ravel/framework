import { Request } from '@h3ravel/http'
import { Route } from '../Route'

export class RouteMatched {
    /**
     * Create a new event instance.
     *
     * @param route  The route instance.
     * @param request  The request instance.
     */
    public constructor(
        public route: Route,
        public request: Request,
    ) {
    }
}