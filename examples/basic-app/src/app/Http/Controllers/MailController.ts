import { ExampleMail } from 'src/app/Mail/ExampleMail'
import { Injectable } from '@h3ravel/core'
import { Mailer } from '@h3ravel/mail'

export class MailController {
    @Injectable()
    public async send (mailer: Mailer) {
        console.log(await mailer.send(new ExampleMail('John', 'user@mail.com')))
        return { name: 'Hello' }
    }
}
