import { Application, Controller } from '@h3ravel/core'

import { HttpContext } from '@h3ravel/http'
import { Mailer } from '@h3ravel/mail'

export class HomeController extends Controller {
    constructor(app: Application, private mailer: Mailer) {
        super(app)
    }
    public async index ({ response }: HttpContext) {
        const view = this.app.make('view')
        const mailer = this.app.make(Mailer);
        console.log(this.mailer, mailer)
        return response.html(await view('index', {
            links: {
                documentation: 'https://h3ravel.toneflix.net/docs',
                performance: 'https://h3ravel.toneflix.net/performance',
                integration: 'https://h3ravel.toneflix.net/h3-integration',
                features: 'https://h3ravel.toneflix.net/features',
            }
        }))
    }
}
