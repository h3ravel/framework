import { type SendMailOptions } from 'nodemailer';

import { MailDriverContract } from '../Contracts/Mailer';

export class LOGDriver implements MailDriverContract {
    private transporter: any;

    constructor(_config: any) {
        // Don something here in the future
    }

    async send (options: SendMailOptions) {
        // Don something here in the future
        console.log(options)
    }
}
