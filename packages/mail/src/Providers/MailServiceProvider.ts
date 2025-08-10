import { Mailer } from '../Mailer';
import { SMTPConfig } from '../Contracts/Mailer';
import { SMTPDriver } from '../Drivers/SMTPDriver';
import { ServiceProvider } from '@h3ravel/core';

/**
 * Mail delivery setup.
 * 
 * Bind Mailer service.
 * Load mail drivers (SMTP, SES, etc.).
 * Register Mail facade.
 * 
 */
export class MailServiceProvider extends ServiceProvider {
    public static priority = 990;
    register () {
        /**
         * Register Mailer instance
         */

        this.app.singleton<any>('mailer', () => {
            // this.app.bind(Mailer, () => {
            const view = this.app.make('view');
            const config = this.app.make('config');

            const smtpConfig: SMTPConfig = {
                host: config.get('mail.mailers.smtp.host', 'smtp.mailtrap.io'),
                port: Number(config.get('mail.mailers.smtp.port', 2525)),
                auth: {
                    user: config.get('mail.mailers.smtp.username', ''),
                    pass: config.get('mail.mailers.smtp.password', ''),
                },
                opportunisticTLS: config.get('mail.mailers.smtp.encryption') === 'tls',
                connectionTimeout: config.get('mail.mailers.smtp.timeout'),
                debug: false,
            };

            return new Mailer(
                new SMTPDriver(smtpConfig),
                async (viewPath, data) => await view(viewPath, data)
            );
        });
    }

    boot () {
        /**
         * Add logic here for global mail "from" address and others
         */
    }
}
