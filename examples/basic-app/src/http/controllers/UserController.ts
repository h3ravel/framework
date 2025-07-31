import { Controller } from '../../../../../packages/core/src/Controller'
import { H3Event } from 'h3'

export class UserController extends Controller {
    index (event: H3Event) {
        return [{ id: 1, name: 'John Doe' }]
    }

    store (event: H3Event) {
        return { message: 'User created' }
    }

    show (event: H3Event) {
        return { id: event.context.params.id, name: 'John Doe' }
    }

    update (event: H3Event) {
        return { message: `User ${event.context.params.id} updated` }
    }

    destroy (event: H3Event) {
        return { message: `User ${event.context.params.id} deleted` }
    }
}
