import { Request } from '@h3ravel/http'

export class Routing {
    /**
     * Create a new event instance.
     *
     * @param request  The request instance.
     */
    public constructor(
        public request: Request,
    ) {
    }
}