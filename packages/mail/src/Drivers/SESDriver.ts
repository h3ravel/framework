import nodemailer, { type SendMailOptions } from 'nodemailer';

import { MailDriverContract, SESConfig } from '../Contracts/Mailer';
import { SendEmailCommand, SESv2Client } from '@aws-sdk/client-sesv2';

export class SESDriver implements MailDriverContract {
    private transporter;

    constructor(config: SESConfig) {

        // 1. Configure the AWS SDK client (uses default credential chain if omitted)
        const sesClient = new SESv2Client({
            region: config.region,
            credentials: {
                accessKeyId: config.key,
                secretAccessKey: config.secret
            }
        });

        // 2. Create a Nodemailer transport that points at SES
        this.transporter = nodemailer.createTransport({
            SES: { sesClient, SendEmailCommand },
            maxConnections: config.maxConnections,
            sendingRate: config.sendingRate
        });
    }

    async send (options: SendMailOptions) {
        // 3. Send the message
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
