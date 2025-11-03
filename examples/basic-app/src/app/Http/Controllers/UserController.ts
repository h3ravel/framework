import { Controller, Injectable } from '@h3ravel/core'
import { HttpContext, Request, Response } from '@h3ravel/http'

import { User } from 'App/Models/user'

export class UserController extends Controller {
    index () {
        return [{ id: 1, name: 'John Doe' }]
    }

    @Injectable()
    async store (request: Request, response: Response) {
        const d = request.ip()
        console.log('!', d, '==!')
        return response
            .setStatusCode(202)
            .json({ message: `User ${await request.input('name')} created` })
    }

    @Injectable()
    async show ({ response }: HttpContext, user: User) {

        return response
            .json({ id: user.id, name: user.name, created_at: user.created_at })
    }

    @Injectable()
    async update (request: Request, response: Response) {
        return response
            .setStatusCode(201)
            .json({ message: `User ${await request.input('name')} updated` })
    }

    destroy ({ request }: HttpContext) {
        return { message: `User ${request.input('id')} deleted` }
    }
}
