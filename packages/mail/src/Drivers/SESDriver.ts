import nodemailer, { type SendMailOptions } from 'nodemailer';

import { MailDriverContract, SESConfig } from '../Contracts/Mailer';

export class SESDriver implements MailDriverContract {
    private transporter;

    constructor(config: SESConfig) {
        this.transporter = nodemailer.createTransport({
            SES: config.SES,
            maxConnections: config.maxConnections,
            sendingRate: config.sendingRate
        });
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
        });
    }
}
