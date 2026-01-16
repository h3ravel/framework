import { Controller, Injectable } from '@h3ravel/core'
import { HttpContext, Request, Response } from '@h3ravel/http'

import { Project } from 'src/app/Models/project'
import { User } from 'App/Models/user'

export class ProjectController extends Controller {
    @Injectable()
    index (user: User) {
        return user.getRelated('projects')
    }

    @Injectable()
    async store (request: Request, response: Response, user: User) {
        const validate = await request.validate({
            name: ['required', 'string'],
        })

        console.log(validate, user)

        return response
            .setStatusCode(202)
            .json({ message: `Project ${request.input('name')} created` })
    }

    @Injectable()
    async show (user: User, project: Project) {
        return response()
            .setCache({ max_age: 50011, private: false })
            .setStatusCode(202)
            .json({ user, project })
    }

    @Injectable()
    async update ({ request, response }: HttpContext, user: User, project: Project) {
        return response
            .setStatusCode(201)
            .json({ message: `Project ${request.input('name')} updated`, user, project })
    }

    @Injectable()
    destroy ({ request }: HttpContext, user: User, project: Project) {
        return { message: `Project ${request.input('id')} deleted`, user, project }
    }
}
