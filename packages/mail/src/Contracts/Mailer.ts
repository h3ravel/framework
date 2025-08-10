import type { SendMailOptions as NodeMailerSendMailOptions } from "nodemailer";
import SMTPConnection from "nodemailer/lib/smtp-connection";

export interface SendMailOptions extends NodeMailerSendMailOptions {
    viewPath?: string,
    viewData?: Record<string, any>
}

export interface SMTPConfig extends SMTPConnection.Options {
    host: string;
    port: number;
    auth: {
        user: string;
        pass: string;
    };
}

export interface MailDriverContract {
    send (options: NodeMailerSendMailOptions): Promise<any>;
}
