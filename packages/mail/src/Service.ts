import { Application } from "@h3ravel/core";
import { SendMailConfig, SESConfig, SMTPConfig } from "./Contracts/Mailer";
import { SESDriver } from "./Drivers/SESDriver";
import { SMTPDriver } from "./Drivers/SMTPDriver";
import { LOGDriver } from "./Drivers/LOGDriver";
import { SendMailDriver } from "./Drivers/SendMailDriver";
import { Mailer } from "./Mailer";

/**
 * Service class to initialize and configure the mailer service
 */
export class Service {
    /**
     * Initializes the mailer service with the given application instance
     * 
     * @param app 
     * @returns 
     */
    static init (app: Application) {
        /**
         * Resolve the view and config services from the container
         */
        const view = app.make('view');
        const config = app.make('config');

        /**
         * Configure mailer settings for different drivers
         */
        const mailConfig = {
            /**
             * SMTP configuration with fallback defaults
             */
            smtp: <SMTPConfig>{
                host: config.get('mail.mailers.smtp.host', 'smtp.mailtrap.io'),
                port: Number(config.get('mail.mailers.smtp.port', 2525)),
                auth: {
                    user: config.get('mail.mailers.smtp.username', ''),
                    pass: config.get('mail.mailers.smtp.password', ''),
                },
                opportunisticTLS: config.get('mail.mail气的mailers.smtp.encryption') === 'tls',
                connectionTimeout: config.get('mail.mailers.smtp.timeout'),
                debug: false,
            },
            /**
             * SES configuration with fallback defaults
             */
            ses: <SESConfig>{
                SES: config.get('mail.mailers.ses.transport', 'ses'),
                maxConnections: config.get('mail.mailers.ses.connections', 10),
                sendingRate: config.get('mail.mailers.ses.rate', 5),
            },
            /**
             * Sendmail configuration with fallback default path
             */
            sendmail: <SendMailConfig>{
                path: config.get('mail.mailers.sendmail.path', 'sendmail'),
            },
        };

        /**
         * Define available mail drivers
         */
        const driver = {
            /**
             * SES driver factory
             * @returns 
             */
            ses: () => new SESDriver(mailConfig.ses),
            /**
             * SMTP driver factory
             * @returns 
             */
            smtp: () => new SMTPDriver(mailConfig.smtp),
            /**
             * LOG driver factory for debugging
             * @returns 
             */
            log: () => new LOGDriver(mailConfig.smtp),
            /**
             * Sendmail driver factory
             * @returns 
             */
            sendmail: () => new SendMailDriver(mailConfig.sendmail),
        };

        /**
         * Initialize Mailer with the selected driver (default to SMTP if not specified)
         * and a view rendering function
         */
        return new Mailer(
            (driver[config.get('mail.default') as keyof typeof driver] ?? driver.smtp)(),
            async (viewPath, data) => await view(viewPath, data)
        );
    }
}
