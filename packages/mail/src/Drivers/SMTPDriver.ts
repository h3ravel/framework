import nodemailer, { type SendMailOptions, type TransportOptions } from 'nodemailer';

import { MailDriverContract, SMTPConfig } from '../Contracts/Mailer';

export class SMTPDriver implements MailDriverContract {
    private transporter;

    constructor(config: SMTPConfig) {
        this.transporter = nodemailer.createTransport({
            host: config.host,
            port: config.port,
            secure: config.port === 465, // auto decide based on port
            auth: {
                user: config.auth.user,
                pass: config.auth.pass
            }
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
