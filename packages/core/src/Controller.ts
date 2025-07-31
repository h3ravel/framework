import { H3Event } from "h3";

export abstract class Controller {
    // Shared logic for controllers should go here (middleware, helpers, etc.)
    public show (event: H3Event): any {
        return event
    }
    public index (event: H3Event): any {
        return event
    }
    public store (event: H3Event): any {
        return event
    }
    public update (event: H3Event): any {
        return event
    }
    public destroy (event: H3Event): any {
        return event
    }
}
