import type { SendMailOptions as NodeMailerSendMailOptions, SentMessageInfo } from 'nodemailer'

import SESConnection from 'nodemailer/lib/ses-transport'
import SMTPConnection from 'nodemailer/lib/smtp-connection'
import SendmailTransport from 'nodemailer/lib/sendmail-transport'

export interface DeliveryReport {
    accepted: string[],
    rejected: string[],
    ehlo: string[],
    envelopeTime: number,
    messageTime: number,
    messageSize: number,
    response: string,
    envelope: {
        [key: string]: any
        to: string[]
        from: string,
    },
    messageId: string
}

export interface SendMailOptions extends NodeMailerSendMailOptions {
    viewPath?: string,
    viewData?: Record<string, any>
}

export interface SMTPConfig extends SMTPConnection.Options {
    /** the hostname or IP address to connect to (defaults to ‘localhost’) */
    host?: string | undefined;
    /** the port to connect to (defaults to 25 or 465) */
    port?: number | undefined;
    /** defines authentication data */
    auth: {
        user: string;
        pass: string;
    };
}

export interface SESConfig extends SESConnection.Options {
    /** How many messages per second is allowed to be delivered to SES */
    maxConnections?: number | undefined;
    /** How many parallel connections to allow towards SES */
    sendingRate?: number | undefined;
    region?: string
    secret: string
    token?: string;
    key: string
}

export interface SendMailConfig extends SendmailTransport.Options {
    /** path to the sendmail command (defaults to ‘sendmail’) */
    path?: string | undefined;
}

export interface MailDriverContract {
    send (options: NodeMailerSendMailOptions): Promise<DeliveryReport | SentMessageInfo | undefined | void>;
}
