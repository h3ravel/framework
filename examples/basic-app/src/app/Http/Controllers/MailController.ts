import { Injectable } from '@h3ravel/core'
import { Mailer } from '@h3ravel/mail'

export class MailController {
    @Injectable()
    public async send (mailer: Mailer) {
        console.log(mailer)
        return { name: 'Hello' }
    }
}
