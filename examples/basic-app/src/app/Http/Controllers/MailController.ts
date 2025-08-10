import { Application, Controller, Injectable } from '@h3ravel/core'

import { HttpContext } from '@h3ravel/http'
import { Mailer } from '@h3ravel/mail'

@Injectable()
export class MailController {//extends Controller {
    constructor(private app: Application, private mailer: Mailer) {
        // super(app)
    }
    public async send ({ response }: HttpContext, mailer: Mailer) {
        // console.log(this.mailer, this.app, response)
        return { name: 'Hello' }
    }
}
