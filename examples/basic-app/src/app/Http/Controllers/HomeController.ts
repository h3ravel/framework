import { Application, Controller } from '@h3ravel/core'

import { HttpContext } from '@h3ravel/http'

export class HomeController extends Controller {
    constructor(app: Application) {
        super(app)
    }
    public async index ({ response }: HttpContext) {
        const view = this.app.make('view')

        return response.html(await view('index', {
            links: {
                documentation: 'https://h3ravel.toneflix.net/introduction',
                performance: 'https://h3ravel.toneflix.net/#why-h3ravel',
                integration: 'https://h3ravel.toneflix.net/#why-h3ravel',
                features: 'https://h3ravel.toneflix.net/#features',
            }
        }))
    }
}
