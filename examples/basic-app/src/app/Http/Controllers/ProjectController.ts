import { Controller, Injectable } from '@h3ravel/core'
import { HttpContext, Request, Response } from '@h3ravel/http'

import { Project } from 'src/app/Models/project'
import { User } from 'App/Models/user'

export class ProjectController extends Controller {
    index (user: User) {
        return user.toJSON()
    }

    @Injectable()
    async store (request: Request, response: Response, user: User) {
        const validate = await request.validate({
            name: ['required', 'string'],
        })

        console.log(validate)

        return response
            .setStatusCode(202)
            .json({ message: `User ${request.input('name')} created` })
    }

    @Injectable()
    async show (response: Response, user: User, project: Project) {
        console.log(project.user_id, 'response, user')
        // console.log(response, user, project.getRelation('user'), 'response, user')
        // return response
        //     .setCache({ max_age: 50011, private: false })
        //     .setStatusCode(202)
        //     .setContent(JSON.stringify({ id: user.id, name: user.name, created_at: user.created_at }))
    }

    async update ({ request, response }: HttpContext, user: User, project: Project) {
        return response
            .setStatusCode(201)
            .json({ message: `User ${request.input('name')} updated`, user, project })
    }

    destroy ({ request }: HttpContext, user: User, project: Project) {
        return { message: `User ${request.input('id')} deleted`, user, project }
    }
}
