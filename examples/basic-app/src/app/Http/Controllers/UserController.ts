import { Controller, Injectable } from '@h3ravel/core'
import { HttpContext, Request, Response } from '@h3ravel/http'

import { User } from 'App/Models/user'

export class UserController extends Controller {
    index () {
        return [{ id: 1, name: 'John Doe' }]
    }

    @Injectable()
    async store (request: Request, response: Response) {
        return response
            .setStatusCode(202)
            .json({ message: `User ${request.input('name')} created` })
    }

    @Injectable()
    async show (response: Response, user: User) {
        return response
            .setCache({ max_age: 50011, private: false })
            .setStatusCode(202)
            .setContent(JSON.stringify({ id: user.id, name: user.name, created_at: user.created_at }))
    }

    async update ({ request, response }: HttpContext) {
        return response
            .setStatusCode(201)
            .json({ message: `User ${request.input('name')} updated` })
    }

    destroy ({ request }: HttpContext) {
        return { message: `User ${request.input('id')} deleted` }
    }
}
