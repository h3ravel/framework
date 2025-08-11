import nodemailer, { type SendMailOptions } from 'nodemailer';

import { MailDriverContract } from '../Contracts/Mailer';
import Stream from 'stream';

export class LOGDriver implements MailDriverContract {
    private transporter

    constructor(_config: any) {
        this.transporter = nodemailer.createTransport({
            streamTransport: true,
            newline: "unix",
        });
    }

    async send (options: SendMailOptions) {
        this.transporter.sendMail(options, (err, info) => {
            if (err) throw err;
            console.log(info.envelope);
            console.log(info.messageId);
            // Pipe the raw RFC 822 message to STDOUT
            info.message instanceof Stream.Readable && info.message.pipe(process.stdout);
        }
        );
    }
}
