import nodemailer, { type SendMailOptions } from 'nodemailer'

import { MailDriverContract, SendMailConfig } from '../Contracts/Mailer'

export class SendMailDriver implements MailDriverContract {
    private transporter

    constructor(config: SendMailConfig) {
        this.transporter = nodemailer.createTransport({
            sendmail: true,
            path: config.path,
        })
    }

    async send (options: SendMailOptions) {
        return await this.transporter.sendMail({
            to: options.to,
            cc: options.cc,
            bcc: options.bcc,
            subject: options.subject,
            html: options.html,
            text: options.text,
            attachments: options.attachments
        })
    }
}
