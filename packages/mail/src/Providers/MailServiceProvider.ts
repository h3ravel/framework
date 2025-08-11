import { Mailer } from '../Mailer';
import { SESConfig, SMTPConfig } from '../Contracts/Mailer';
import { SMTPDriver } from '../Drivers/SMTPDriver';
import { ServiceProvider } from '@h3ravel/core';
import { SESDriver } from '../Drivers/SESDriver';
import { LOGDriver } from '../Drivers/LOGDriver';

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
        this.app.singleton<any>(Mailer, () => {
            const view = this.app.make('view');
            const config = this.app.make('config');

            const mailConfig = {
                smtp: <SMTPConfig>{
                    host: config.get('mail.mailers.smtp.host', 'smtp.mailtrap.io'),
                    port: Number(config.get('mail.mailers.smtp.port', 2525)),
                    auth: {
                        user: config.get('mail.mailers.smtp.username', ''),
                        pass: config.get('mail.mailers.smtp.password', ''),
                    },
                    opportunisticTLS: config.get('mail.mailers.smtp.encryption') === 'tls',
                    connectionTimeout: config.get('mail.mailers.smtp.timeout'),
                    debug: false,
                },
                ses: <SESConfig>{
                    SES: config.get('mail.mailers.ses.transport', 'ses'),
                    maxConnections: config.get('mail.mailers.ses.connections', 10),
                    sendingRate: config.get('mail.mailers.ses.rate', 5),
                }
            };

            const driver = {
                ses: () => new SESDriver(mailConfig.ses),
                smtp: () => new SMTPDriver(mailConfig.smtp),
                log: () => new LOGDriver(mailConfig.smtp),
            }

            return new Mailer(
                (driver[config.get('mail.default') as keyof typeof driver] ?? driver.smtp)(),
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
