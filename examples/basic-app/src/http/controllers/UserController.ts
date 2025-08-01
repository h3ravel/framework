import { Controller } from '@h3ravel/core'
import { HttpContext } from '@h3ravel/http'

export class UserController extends Controller {
    async index () {
        return [{ id: 1, name: 'John Doe' }]
    }

    store ({ request, response }: HttpContext) {
        console.log(request.all())
        return response.setStatusCode(202).json({ message: 'User created' })
    }

    show ({ request, response }: HttpContext) {
        return response.json({ id: request.input('id'), name: 'John Doe' })
    }

    update ({ request, response }: HttpContext) {
        return response.setStatusCode(201).json({ message: `User ${request.input('id')} updated` })
    }

    destroy ({ request }: HttpContext) {
        return { message: `User ${request.input('id')} deleted` }
    }
}
