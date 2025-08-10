import type { SendMailOptions } from "./Contracts/Mailer";

export abstract class Mailable {
    protected toAddress?: string;
    protected ccAddresses?: string[];
    protected bccAddresses?: string[];
    protected subjectText?: string;
    protected htmlContent?: string;
    protected textContent?: string;
    protected viewPath?: string;
    protected viewData?: Record<string, any>;
    protected attachmentsList?: SendMailOptions['attachments'];

    to (address: string) {
        this.toAddress = address;
        return this;
    }

    cc (...addresses: string[]) {
        this.ccAddresses = addresses;
        return this;
    }

    bcc (...addresses: string[]) {
        this.bccAddresses = addresses;
        return this;
    }

    subject (subject: string) {
        this.subjectText = subject;
        return this;
    }

    html (html: string) {
        this.htmlContent = html;
        return this;
    }

    text (text: string) {
        this.textContent = text;
        return this;
    }

    view (path: string, data: Record<string, any> = {}) {
        this.viewPath = path;
        this.viewData = data;
        return this;
    }

    attach (filename: string, filePath: string) {
        if (!this.attachmentsList) this.attachmentsList = [];
        this.attachmentsList.push({ filename, path: filePath });
        return this;
    }

    /**
     * Child classes should define build() like in Laravel
     */
    abstract build (): Promise<this> | this;

    /**
     * Called internally by Mailer
     */
    getMessageOptions (): SendMailOptions {
        return {
            to: this.toAddress,
            cc: this.ccAddresses,
            bcc: this.bccAddresses,
            subject: this.subjectText,
            html: this.htmlContent,
            text: this.textContent,
            viewPath: this.viewPath,
            viewData: this.viewData,
            attachments: this.attachmentsList
        };
    }
}
